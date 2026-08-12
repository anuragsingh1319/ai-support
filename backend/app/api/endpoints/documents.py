import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from pydantic import BaseModel

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.models.document import Document
from app.worker import process_document_background
from app.services.embeddings import get_vector_store

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class SearchQuery(BaseModel):
    query: str
    top_k: int = 5

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
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
    
    # Trigger background task natively
    background_tasks.add_task(process_document_background, str(doc.id))
    
    return {"message": "Document uploaded successfully", "document_id": str(doc.id)}

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
        
    vector_store = get_vector_store()
    if not vector_store:
        raise HTTPException(status_code=404, detail="Vector index not found")
        
    docs = await vector_store.asimilarity_search(
        search.query, 
        k=search.top_k, 
        filter={"organization_id": str(current_user.organization_id)}
    )
    
    return [
        {"content": chunk.page_content, "metadata": chunk.metadata}
        for chunk in docs
    ]
