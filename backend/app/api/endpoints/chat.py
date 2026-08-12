import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from app.db.session import get_db
from app.models.chat import Conversation, Message, SenderType, ConversationStatus
from app.models.agent import Agent
from app.services.chat_ai import stream_ai_response

router = APIRouter()


class StartChatRequest(BaseModel):
    agent_id: str


class SendMessageRequest(BaseModel):
    session_id: str
    message: str


@router.post("/start")
async def start_conversation(
    request: StartChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """Initialize a new chat session for a visitor. Returns a session_id."""
    # Validate agent exists
    result = await db.execute(select(Agent).filter(Agent.id == request.agent_id))
    agent = result.scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    session_id = str(uuid.uuid4())
    conversation = Conversation(
        organization_id=agent.organization_id,
        agent_id=agent.id,
        session_id=session_id,
        status=ConversationStatus.ACTIVE,
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)

    return {
        "session_id": session_id,
        "conversation_id": str(conversation.id),
        "agent_name": agent.name,
    }


@router.post("/message")
async def send_message(
    request: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
):
    """Receive a user message and stream back the AI response via SSE."""
    # Lookup conversation by session_id
    result = await db.execute(
        select(Conversation).filter(Conversation.session_id == request.session_id)
    )
    conversation = result.scalars().first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Session not found")

    if conversation.status == ConversationStatus.ENDED:
        raise HTTPException(status_code=400, detail="This conversation has ended")

    # Save user's message
    user_message = Message(
        conversation_id=conversation.id,
        sender=SenderType.USER,
        content=request.message,
    )
    db.add(user_message)
    await db.commit()

    # Fetch agent for prompt
    agent_result = await db.execute(select(Agent).filter(Agent.id == conversation.agent_id))
    agent = agent_result.scalars().first()
    agent_prompt = agent.prompt or "You are a helpful customer support assistant."

    # Return streaming SSE response
    return StreamingResponse(
        stream_ai_response(
            user_message=request.message,
            conversation=conversation,
            agent_prompt=agent_prompt,
            db=db,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/history/{session_id}")
async def get_chat_history(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full message history for a session."""
    result = await db.execute(
        select(Conversation).filter(Conversation.session_id == session_id)
    )
    conversation = result.scalars().first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Session not found")

    messages_result = await db.execute(
        select(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
    )
    messages = messages_result.scalars().all()

    return [
        {
            "id": str(msg.id),
            "sender": msg.sender.value,
            "content": msg.content,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
        }
        for msg in messages
    ]
