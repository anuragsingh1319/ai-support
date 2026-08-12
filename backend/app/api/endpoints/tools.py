from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, UUID4

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.models.tool import Tool
from app.models.agent import Agent

router = APIRouter()

class ToolCreate(BaseModel):
    name: str
    description: str
    api_endpoint: str
    auth_header_name: Optional[str] = None
    auth_header_value: Optional[str] = None

class ToolUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    api_endpoint: Optional[str] = None
    auth_header_name: Optional[str] = None
    auth_header_value: Optional[str] = None

@router.get("/")
async def list_tools(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List all tools for the organization."""
    result = await db.execute(
        select(Tool).filter(Tool.organization_id == current_user.organization_id)
    )
    tools = result.scalars().all()
    return tools

@router.post("/")
async def create_tool(
    tool_in: ToolCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new tool."""
    tool = Tool(
        organization_id=current_user.organization_id,
        name=tool_in.name,
        description=tool_in.description,
        api_endpoint=tool_in.api_endpoint,
        auth_header_name=tool_in.auth_header_name,
        auth_header_value=tool_in.auth_header_value
    )
    db.add(tool)
    await db.commit()
    await db.refresh(tool)
    return tool

@router.delete("/{tool_id}")
async def delete_tool(
    tool_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a tool."""
    result = await db.execute(
        select(Tool).filter(
            Tool.id == tool_id, 
            Tool.organization_id == current_user.organization_id
        )
    )
    tool = result.scalars().first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
        
    await db.delete(tool)
    await db.commit()
    return {"message": "Tool deleted"}

@router.post("/{tool_id}/assign/{agent_id}")
async def assign_tool_to_agent(
    tool_id: str,
    agent_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Assign a tool to an agent."""
    # Verify tool
    t_result = await db.execute(
        select(Tool).filter(Tool.id == tool_id, Tool.organization_id == current_user.organization_id)
    )
    tool = t_result.scalars().first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    # Verify agent and load tools
    a_result = await db.execute(
        select(Agent).options(selectinload(Agent.tools)).filter(Agent.id == agent_id, Agent.organization_id == current_user.organization_id)
    )
    agent = a_result.scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if tool not in agent.tools:
        agent.tools.append(tool)
        await db.commit()
        
    return {"message": "Tool assigned successfully"}

@router.delete("/{tool_id}/unassign/{agent_id}")
async def unassign_tool_from_agent(
    tool_id: str,
    agent_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Unassign a tool from an agent."""
    a_result = await db.execute(
        select(Agent).options(selectinload(Agent.tools)).filter(Agent.id == agent_id, Agent.organization_id == current_user.organization_id)
    )
    agent = a_result.scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    agent.tools = [t for t in agent.tools if str(t.id) != tool_id]
    await db.commit()
    return {"message": "Tool unassigned successfully"}
