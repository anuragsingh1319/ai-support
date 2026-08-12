import os
import asyncio
import json
from typing import AsyncGenerator
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.chat import Conversation, Message, SenderType
from app.models.document import DocumentChunk
from app.services.embeddings import generate_embeddings

client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

async def retrieve_context(query: str, organization_id: str, db: AsyncSession, top_k: int = 5) -> str:
    """Perform vector search to retrieve relevant document chunks for the query."""
    query_embeddings = await generate_embeddings([query])
    if not query_embeddings:
        return ""

    query_vector = query_embeddings[0]

    result = await db.execute(
        select(DocumentChunk)
        .filter(DocumentChunk.organization_id == organization_id)
        .order_by(DocumentChunk.embedding.l2_distance(query_vector))
        .limit(top_k)
    )
    chunks = result.scalars().all()
    return "\n\n---\n\n".join(chunk.content for chunk in chunks)


async def stream_ai_response(
    user_message: str,
    conversation: Conversation,
    agent_prompt: str,
    db: AsyncSession,
) -> AsyncGenerator[str, None]:
    """
    Retrieve context via RAG and stream an LLM response using SSE.
    Saves the completed response to the DB when done.
    """
    # 1. Retrieve context from knowledge base
    context = await retrieve_context(
        user_message,
        str(conversation.organization_id),
        db
    )

    # 2. Build messages for the LLM
    system_prompt = f"""{agent_prompt}

You are a helpful AI customer support agent. Use the following context from the company's knowledge base to answer the user's question accurately and concisely.

<context>
{context if context else "No relevant information found in the knowledge base."}
</context>

If the context doesn't contain relevant information, use your general knowledge but be transparent that it's not from the official knowledge base. If you cannot help, offer to escalate to a human agent."""

    # 3. Fetch recent conversation history for context
    history_result = await db.execute(
        select(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
        .limit(10)
    )
    history = history_result.scalars().all()
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        role = "user" if msg.sender == SenderType.USER else "assistant"
        messages.append({"role": role, "content": msg.content})
    messages.append({"role": "user", "content": user_message})

    # 4. Stream from OpenAI
    full_response = ""
    async with client.chat.completions.stream(
        model="gpt-4o-mini",
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            full_response += text
            # Yield as SSE data
            yield f"data: {json.dumps({'chunk': text})}\n\n"

    # 5. Save AI response to DB
    ai_message = Message(
        conversation_id=conversation.id,
        sender=SenderType.AI,
        content=full_response,
    )
    db.add(ai_message)
    await db.commit()

    # Signal stream end
    yield f"data: {json.dumps({'done': True})}\n\n"
