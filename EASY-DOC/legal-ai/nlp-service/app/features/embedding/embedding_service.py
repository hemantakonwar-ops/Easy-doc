from typing import List
from app.core.embeddings import get_embedding_service
from app.core.vector_db import get_vector_db

async def embed_texts(texts: List[str]) -> List[List[float]]:
    """Embed texts using the core embedding service."""
    svc = get_embedding_service()
    return await svc.encode(texts)

async def embed_query(query: str) -> List[float]:
    """Embed a single query."""
    svc = get_embedding_service()
    return await svc.encode_query(query)

async def store_embeddings(document_id: str, texts: List[str], embeddings: List[List[float]]):
    """Store embeddings in vector database in batches, deleting any existing first."""
    db = get_vector_db()
    
    # Ensure no duplicates: delete existing chunks for this document
    db.delete_document(document_id)
    
    BATCH_SIZE = 32
    total_chunks = len(texts)
    
    for i in range(0, total_chunks, BATCH_SIZE):
        batch_texts = texts[i:i + BATCH_SIZE]
        batch_embeddings = embeddings[i:i + BATCH_SIZE]
        batch_ids = [f"{document_id}_{j}" for j in range(i, i + len(batch_texts))]
        batch_metadatas = [
            {"document_id": document_id, "chunk_index": j}
            for j in range(i, i + len(batch_texts))
        ]
        
        # Add batch to vector DB
        db.add_documents(batch_texts, batch_embeddings, batch_ids, batch_metadatas)

async def embed_and_store(document_id: str, texts: List[str]) -> dict:
    """Embed texts and store them (convenience function)."""
    embeddings = await embed_texts(texts)
    await store_embeddings(document_id, texts, embeddings)
    return {"document_id": document_id, "chunks": len(texts)}
