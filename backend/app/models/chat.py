import uuid
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import relationship
from .base import TimestampMixin, Base
import enum


class ConversationStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    ENDED = "ENDED"
    ESCALATED = "ESCALATED"


class SenderType(enum.Enum):
    USER = "USER"
    AI = "AI"
    HUMAN = "HUMAN"


class Conversation(TimestampMixin, Base):
    __tablename__ = "conversations"
    id = Column(postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(
        postgresql.UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    agent_id = Column(
        postgresql.UUID(as_uuid=True),
        ForeignKey("agents.id", ondelete="CASCADE"),
        nullable=False,
    )
    session_id = Column(String, unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    status = Column(Enum(ConversationStatus), default=ConversationStatus.ACTIVE, nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(TimestampMixin, Base):
    __tablename__ = "messages"
    id = Column(postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(
        postgresql.UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
    )
    sender = Column(Enum(SenderType), nullable=False)
    content = Column(String, nullable=False)
    metadata = Column(JSON, nullable=True)  # stores token counts, latency_ms, etc.

    conversation = relationship("Conversation", back_populates="messages")
