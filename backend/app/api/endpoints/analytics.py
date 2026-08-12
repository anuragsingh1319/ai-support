from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.models.chat import Conversation, Message, ConversationStatus

router = APIRouter()


@router.get("/overview")
async def get_analytics_overview(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Return analytics overview stats and 30-day daily breakdown for the org."""
    org_id = current_user.organization_id

    # --- Total conversations ---
    total_conv_result = await db.execute(
        select(func.count(Conversation.id)).filter(Conversation.organization_id == org_id)
    )
    total_conversations = total_conv_result.scalar() or 0

    # --- Active conversations ---
    active_result = await db.execute(
        select(func.count(Conversation.id)).filter(
            Conversation.organization_id == org_id,
            Conversation.status == ConversationStatus.ACTIVE,
        )
    )
    active_conversations = active_result.scalar() or 0

    # --- Escalated conversations ---
    escalated_result = await db.execute(
        select(func.count(Conversation.id)).filter(
            Conversation.organization_id == org_id,
            Conversation.status == ConversationStatus.ESCALATED,
        )
    )
    escalated_conversations = escalated_result.scalar() or 0

    # --- Total messages ---
    msg_result = await db.execute(
        select(func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(Conversation.organization_id == org_id)
    )
    total_messages = msg_result.scalar() or 0

    # --- Daily conversation counts for last 30 days ---
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    daily_result = await db.execute(
        select(
            func.strftime("%Y-%m-%d", Conversation.created_at).label("day"),
            func.count(Conversation.id).label("count"),
        )
        .filter(
            Conversation.organization_id == org_id,
            Conversation.created_at >= thirty_days_ago,
        )
        .group_by("day")
        .order_by("day")
    )
    daily_rows = daily_result.all()
    daily_breakdown = [
        {"date": row.day, "conversations": row.count}
        for row in daily_rows
    ]

    return {
        "total_conversations": total_conversations,
        "active_conversations": active_conversations,
        "escalated_conversations": escalated_conversations,
        "resolved_conversations": total_conversations - active_conversations - escalated_conversations,
        "total_messages": total_messages,
        "avg_messages_per_conversation": round(total_messages / total_conversations, 1) if total_conversations else 0,
        "daily_breakdown": daily_breakdown,
    }
