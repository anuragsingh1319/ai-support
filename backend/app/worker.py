import asyncio
from app.core.celery_app import celery_app
from app.db.session import async_session_maker
from app.models.document import Document, DocumentChunk, DocumentStatus
from app.services.document_parser import extract_text, chunk_text
from app.services.embeddings import generate_embeddings
from sqlalchemy.future import select

# Celery is synchronous by default, so we wrap async DB/OpenAI calls
def process_document_sync(document_id: str):
    asyncio.run(process_document_async(document_id))

@celery_app.task(name="app.worker.process_document_task")
def process_document_task(document_id: str):
    process_document_sync(document_id)

async def process_document_async(document_id: str):
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

            # 3. Generate embeddings
            embeddings = await generate_embeddings(chunks)

            # 4. Store in database
            for text_chunk, embedding in zip(chunks, embeddings):
                doc_chunk = DocumentChunk(
                    document_id=doc.id,
                    organization_id=doc.organization_id,
                    content=text_chunk,
                    embedding=embedding
                )
                db.add(doc_chunk)

            doc.status = DocumentStatus.COMPLETED
            await db.commit()
            print(f"Successfully processed document {document_id}")

        except Exception as e:
            print(f"Error processing document {document_id}: {e}")
            if doc:
                doc.status = DocumentStatus.FAILED
                await db.commit()
