import os
import json
import asyncio
import httpx
from typing import AsyncGenerator, Dict, Any, List
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.chat import Conversation, Message, SenderType
from app.models.agent import Agent
from app.models.tool import Tool
from app.services.embeddings import get_vector_store
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

async def retrieve_context(query: str, organization_id: str, db: AsyncSession, top_k: int = 5) -> str:
    """Perform vector search to retrieve relevant document chunks for the query using FAISS."""
    vector_store = get_vector_store()
    if not vector_store:
        return ""

    try:
        docs = await vector_store.asimilarity_search(
            query, 
            k=top_k, 
            filter={"organization_id": organization_id}
        )
        return "\n\n---\n\n".join(doc.page_content for doc in docs)
    except Exception as e:
        print(f"FAISS search error: {e}")
        return ""


async def execute_tool(tool_name: str, arguments: Dict[str, Any], agent: Agent) -> str:
    """Execute an external API call based on the tool definition."""
    # Find the tool configuration
    tool = next((t for t in agent.tools if t.name == tool_name), None)
    if not tool:
        return f"Error: Tool '{tool_name}' not found or not assigned to this agent."

    headers = {"Content-Type": "application/json"}
    if tool.auth_header_name and tool.auth_header_value:
        headers[tool.auth_header_name] = tool.auth_header_value

    try:
        async with httpx.AsyncClient(timeout=10.0) as http_client:
            response = await http_client.post(
                tool.api_endpoint,
                json=arguments,
                headers=headers
            )
            response.raise_for_status()
            return response.text
    except Exception as e:
        return f"Error executing tool: {str(e)}"


async def stream_ai_response(
    user_message: str,
    conversation: Conversation,
    agent_prompt: str,
    db: AsyncSession,
) -> AsyncGenerator[str, None]:
    """
    Retrieve context via RAG, support OpenAI function calling, and stream the final response using SSE.
    """
    # 1. Fetch Agent and Tools
    result = await db.execute(
        select(Agent)
        .options(selectinload(Agent.tools))
        .filter(Agent.id == conversation.agent_id)
    )
    agent = result.scalars().first()
    if not agent:
        yield f"data: {json.dumps({'chunk': 'Error: Agent not found'})}\n\n"
        return

    # 2. Prepare OpenAI tools array
    openai_tools = []
    if agent.tools:
        for tool in agent.tools:
            openai_tools.append({
                "type": "function",
                "function": {
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "payload": {
                                "type": "string",
                                "description": "Any parameters required by the tool, represented as a JSON string or query parameter payload."
                            }
                        }
                    }
                }
            })

    # 3. Retrieve context from knowledge base
    context = await retrieve_context(user_message, str(conversation.organization_id), db)

    # 4. Build initial messages
    system_prompt = f"""{agent_prompt}

You are a helpful AI customer support agent. Use the following context from the company's knowledge base to answer the user's question.

<context>
{context if context else "No relevant information found in the knowledge base."}
</context>

If you have tools available, you may use them to fetch real-time information.
"""
    
    history_result = await db.execute(
        select(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
        .limit(10)
    )
    history = history_result.scalars().all()
    
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        # Ignore tool execution outputs in standard history to avoid token bloat for now,
        # or map them properly. We'll just map USER, AI, HUMAN.
        role = "user" if msg.sender == SenderType.USER else "assistant"
        messages.append({"role": role, "content": msg.content})
    messages.append({"role": "user", "content": user_message})

    full_response = ""
    
    # 5. First OpenAI Call (might request tool calls or return text directly)
    kwargs = {
        "model": "gpt-4o-mini",
        "messages": messages,
    }
    if openai_tools:
        kwargs["tools"] = openai_tools

    response = await client.chat.completions.create(**kwargs)
    message = response.choices[0].message
    
    # Check if tool calls were requested
    if message.tool_calls:
        messages.append(message)  # Add assistant's tool call request to history
        
        for tool_call in message.tool_calls:
            # Yield a status update to the frontend
            yield f"data: {json.dumps({'status': f'Executing {tool_call.function.name}...'})}\n\n"
            
            # Execute the tool
            args = json.loads(tool_call.function.arguments)
            tool_result = await execute_tool(tool_call.function.name, args, agent)
            
            # Append result
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": tool_call.function.name,
                "content": tool_result
            })
            
        # 6. Second OpenAI Call (Streaming the final answer based on tool results)
        async with client.chat.completions.stream(
            model="gpt-4o-mini",
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                full_response += text
                yield f"data: {json.dumps({'chunk': text})}\n\n"
    else:
        # No tools called, stream the text normally (Wait, since we didn't stream the first call, we just output it)
        # To keep it truly streaming, we could use stream=True on the first call, but handling tool_calls in streams is very verbose.
        # For simplicity in this implementation, if no tool is called, we just output the response in chunks.
        if message.content:
            full_response = message.content
            # Simulate streaming for the frontend
            chunk_size = 10
            for i in range(0, len(full_response), chunk_size):
                yield f"data: {json.dumps({'chunk': full_response[i:i+chunk_size]})}\n\n"
                await asyncio.sleep(0.01)

    # 7. Save AI response to DB
    ai_message = Message(
        conversation_id=conversation.id,
        sender=SenderType.AI,
        content=full_response,
    )
    db.add(ai_message)
    await db.commit()

    yield f"data: {json.dumps({'done': True})}\n\n"
