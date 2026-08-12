import uuid
from sqlalchemy import Column, String, Text, ForeignKey, Table, Uuid
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

# Association table for Many-to-Many relationship between Agents and Tools
agent_tool_association = Table(
    "agent_tool",
    Base.metadata,
    Column("agent_id", Uuid(as_uuid=True), ForeignKey("agents.id", ondelete="CASCADE"), primary_key=True),
    Column("tool_id", Uuid(as_uuid=True), ForeignKey("tools.id", ondelete="CASCADE"), primary_key=True)
)

class Tool(Base, TimestampMixin):
    __tablename__ = "tools"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    organization_id = Column(Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String, nullable=False)  # e.g., "check_order_status"
    description = Column(Text, nullable=False)  # Description for the LLM to understand when to use it
    api_endpoint = Column(String, nullable=False)  # Webhook URL to call
    
    # Simple auth for external API
    auth_header_name = Column(String, nullable=True)  # e.g., "Authorization", "X-Api-Key"
    auth_header_value = Column(String, nullable=True) # e.g., "Bearer token123"

    organization = relationship("Organization", back_populates="tools")
    agents = relationship("Agent", secondary=agent_tool_association, back_populates="tools")
