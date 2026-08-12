import asyncio
from app.db.session import async_session_maker
from app.models.document import Document, DocumentChunk, DocumentStatus
from app.services.document_parser import extract_text, chunk_text
from app.services.embeddings import add_texts_to_vector_store
from sqlalchemy.future import select

async def process_document_background(document_id: str):
    async with async_session_maker() as db:
        try:
            # 1. Fetch document
            result = await db.execute(select(Document).filter(Document.id == document_id))
            doc = result.scalars().first()
            if not doc:
                print(f"Document {document_id} not found.")
                return

            doc.status = DocumentStatus.PROCESSING
            await db.commit()

            # 2. Extract and chunk text
            raw_text = extract_text(doc.file_path)
            chunks = chunk_text(raw_text)

            if not chunks:
                doc.status = DocumentStatus.COMPLETED
                await db.commit()
                return

            # 3. Save chunks in DB and FAISS
            metadatas = []
            for text_chunk in chunks:
                doc_chunk = DocumentChunk(
                    document_id=doc.id,
                    organization_id=doc.organization_id,
                    content=text_chunk
                )
                db.add(doc_chunk)
                metadatas.append({"organization_id": str(doc.organization_id)})
            
            # Flush to get chunk IDs if needed, but not strictly required for FAISS.
            
            # Save vectors to FAISS local store
            add_texts_to_vector_store(chunks, metadatas=metadatas)

            doc.status = DocumentStatus.COMPLETED
            await db.commit()
            print(f"Successfully processed document {document_id}")

        except Exception as e:
            print(f"Error processing document {document_id}: {e}")
            if doc:
                doc.status = DocumentStatus.FAILED
                await db.commit()
