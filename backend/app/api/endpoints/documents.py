import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from pydantic import BaseModel

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.models.document import Document
from app.models.document import DocumentChunk
from app.worker import process_document_task
from app.services.embeddings import generate_embeddings

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class SearchQuery(BaseModel):
    query: str
    top_k: int = 5

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User must belong to an organization")
        
    file_path = os.path.join(UPLOAD_DIR, f"{current_user.organization_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    doc = Document(
        organization_id=current_user.organization_id,
        filename=file.filename,
        file_path=file_path
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    
    # Trigger background task
    process_document_task.delay(str(doc.id))
    
    return {"message": "Document uploaded successfully", "document_id": doc.id}

@router.get("/")
async def list_documents(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Document).filter(Document.organization_id == current_user.organization_id)
    )
    return result.scalars().all()

@router.post("/search")
async def search_documents(
    search: SearchQuery,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Semantic search endpoint to test RAG retrieval."""
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User must belong to an organization")
        
    # Generate embedding for the query
    query_embeddings = await generate_embeddings([search.query])
    if not query_embeddings:
        raise HTTPException(status_code=500, detail="Failed to generate embedding")
        
    query_vector = query_embeddings[0]
    
    # Perform vector similarity search (L2 distance: <->)
    # Filter by organization_id to ensure tenant isolation
    result = await db.execute(
        select(DocumentChunk)
        .filter(DocumentChunk.organization_id == current_user.organization_id)
        .order_by(DocumentChunk.embedding.l2_distance(query_vector))
        .limit(search.top_k)
    )
    
    chunks = result.scalars().all()
    
    return [
        {"id": chunk.id, "content": chunk.content, "document_id": chunk.document_id}
        for chunk in chunks
    ]
