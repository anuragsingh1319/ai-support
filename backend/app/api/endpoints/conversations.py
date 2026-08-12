from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from pydantic import BaseModel

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.models.chat import Conversation, Message, ConversationStatus, SenderType

router = APIRouter()


class HumanReplyRequest(BaseModel):
    session_id: str
    message: str


@router.get("/")
async def list_conversations(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all conversations for the current organization."""
    result = await db.execute(
        select(Conversation)
        .filter(Conversation.organization_id == current_user.organization_id)
        .order_by(Conversation.created_at.desc())
    )
    conversations = result.scalars().all()
    return [
        {
            "id": str(c.id),
            "session_id": c.session_id,
            "agent_id": str(c.agent_id),
            "status": c.status.value,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "resolved_at": c.resolved_at.isoformat() if c.resolved_at else None,
        }
        for c in conversations
    ]


@router.get("/{session_id}/messages")
async def get_conversation_messages(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all messages in a conversation (tenant-scoped)."""
    conv_result = await db.execute(
        select(Conversation).filter(
            Conversation.session_id == session_id,
            Conversation.organization_id == current_user.organization_id,
        )
    )
    conversation = conv_result.scalars().first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msg_result = await db.execute(
        select(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
    )
    messages = msg_result.scalars().all()
    return {
        "conversation": {
            "id": str(conversation.id),
            "session_id": conversation.session_id,
            "status": conversation.status.value,
        },
        "messages": [
            {
                "id": str(m.id),
                "sender": m.sender.value,
                "content": m.content,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ],
    }


@router.post("/{session_id}/escalate")
async def escalate_conversation(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Escalate a conversation from AI to a human agent."""
    result = await db.execute(
        select(Conversation).filter(
            Conversation.session_id == session_id,
            Conversation.organization_id == current_user.organization_id,
        )
    )
    conversation = result.scalars().first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conversation.status = ConversationStatus.ESCALATED
    await db.commit()

    # Notify the visitor via a system message
    system_msg = Message(
        conversation_id=conversation.id,
        sender=SenderType.AI,
        content="You've been connected to a human agent. Please hold on for a moment. 🙋",
    )
    db.add(system_msg)
    await db.commit()

    return {"message": "Conversation escalated successfully", "session_id": session_id}


@router.post("/{session_id}/resolve")
async def resolve_conversation(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a conversation as resolved."""
    result = await db.execute(
        select(Conversation).filter(
            Conversation.session_id == session_id,
            Conversation.organization_id == current_user.organization_id,
        )
    )
    conversation = result.scalars().first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conversation.status = ConversationStatus.ENDED
    conversation.resolved_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Conversation resolved", "session_id": session_id}


@router.post("/human-reply")
async def human_reply(
    request: HumanReplyRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Allow a human agent (dashboard user) to send a message in an escalated conversation."""
    conv_result = await db.execute(
        select(Conversation).filter(
            Conversation.session_id == request.session_id,
            Conversation.organization_id == current_user.organization_id,
        )
    )
    conversation = conv_result.scalars().first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conversation.status != ConversationStatus.ESCALATED:
        raise HTTPException(status_code=400, detail="Only escalated conversations can receive human replies")

    msg = Message(
        conversation_id=conversation.id,
        sender=SenderType.HUMAN,
        content=request.message,
        metadata={"agent_user_id": str(current_user.id)},
    )
    db.add(msg)
    await db.commit()
    return {"message": "Reply sent"}
