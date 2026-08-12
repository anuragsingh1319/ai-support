import os
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OpenAIEmbeddings

FAISS_INDEX_PATH = "faiss_index"

def get_vector_store():
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    if os.path.exists(FAISS_INDEX_PATH):
        return FAISS.load_local(FAISS_INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
    return None

def add_texts_to_vector_store(texts: list[str], metadatas: list[dict]):
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    if os.path.exists(FAISS_INDEX_PATH):
        vector_store = FAISS.load_local(FAISS_INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
        vector_store.add_texts(texts, metadatas=metadatas)
    else:
        vector_store = FAISS.from_texts(texts, embeddings, metadatas=metadatas)
    
    vector_store.save_local(FAISS_INDEX_PATH)
