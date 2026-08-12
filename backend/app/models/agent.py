import uuid
from sqlalchemy import Column, String, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Agent(Base, TimestampMixin):
    __tablename__ = "agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    prompt = Column(Text, nullable=True)
    
    # Configuration JSON to store LLM settings, widget settings, etc.
    configuration = Column(JSON, default={})
    
    organization = relationship("Organization", back_populates="agents")
