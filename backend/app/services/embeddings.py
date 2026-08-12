import os
from openai import AsyncOpenAI
from typing import List

# Setup client, defaults to OPENAI_API_KEY from environment
client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY", "dummy-key-for-dev"))

async def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for a list of strings using OpenAI's text-embedding-3-small model.
    """
    if not texts:
        return []
        
    response = await client.embeddings.create(
        input=texts,
        model="text-embedding-3-small"
    )
    
    return [data.embedding for data in response.data]
