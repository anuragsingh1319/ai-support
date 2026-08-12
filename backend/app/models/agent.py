import uuid
from sqlalchemy import Column, String, Text, ForeignKey, JSON, Uuid
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Agent(Base, TimestampMixin):
    __tablename__ = "agents"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    organization_id = Column(Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    prompt = Column(Text, nullable=True)
    
    # Configuration JSON to store LLM settings, widget settings, etc.
    configuration = Column(JSON, default={})
    
    # Voice-specific configuration
    voice_settings = Column(JSON, default={
        "voice_id": "alloy",  # default OpenAI voice
        "speed": 1.0,
        "language": "en-US"
    })
    
    organization = relationship("Organization", back_populates="agents")
    tools = relationship("Tool", secondary="agent_tool", back_populates="agents")
    conversations = relationship("Conversation", back_populates="agent", cascade="all, delete-orphan")

