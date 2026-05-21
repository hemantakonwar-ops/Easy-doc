from app.core.embeddings import get_embedding_service
from app.core.vector_db import get_vector_db
from app.db.connection import get_db
import re

def compute_keyword_score(query: str, text: str) -> float:
    # Simple term frequency overlap
    query_tokens = set(re.findall(r'\w+', query.lower()))
    text_tokens = set(re.findall(r'\w+', text.lower()))
    if not query_tokens:
        return 0.0
    overlap = len(query_tokens.intersection(text_tokens))
    return min(1.0, overlap / len(query_tokens))

async def search_documents(query: str, document_id: str | None = None, top_k: int = 5):
    """Search for relevant document chunks using ChromaDB with Hybrid Scoring."""
    db = get_db()
    
    # Embed the query
    embedding_svc = get_embedding_service()
    query_embedding = await embedding_svc.encode_query(query)
    
    # Search in vector store - overfetch for re-ranking
    vector_db = get_vector_db()
    where_filter = {"document_id": document_id} if document_id else None
    
    fetch_k = top_k * 3
    results = vector_db.search(query_embedding, top_k=fetch_k, where_filter=where_filter)
    
    # Hybrid Scoring and Re-ranking
    scored_results = []
    for r in results:
        doc_id = r["metadata"].get("document_id")
        chunk_index = r["metadata"].get("chunk_index", 100) # Default large index if missing
        text = r["text"]
        
        # 1. Cosine Score (from ChromaDB directly)
        cosine_score = r["score"]
        
        # 2. Keyword Match Score
        keyword_score = compute_keyword_score(query, text)
        
        # 3. Position Weight Score (earlier chunks get slight boost, decay function)
        # Max score 1.0 at chunk 0, decays to ~0.0 at chunk 100
        position_score = max(0.0, 1.0 - (chunk_index / 100))
        
        # Final Hybrid Score formula
        final_score = (0.6 * cosine_score) + (0.3 * keyword_score) + (0.1 * position_score)
        
        # Apply threshold filter (drop weak matches)
        if final_score >= 0.55:
            scored_results.append({
                "text": text,
                "score": final_score,
                "cosine_raw": cosine_score,
                "documentId": doc_id,
                "snippet": text[:200] + "..." if len(text) > 200 else text
            })
            
    # Sort by final score descending
    scored_results.sort(key=lambda x: x["score"], reverse=True)
    
    # Take top_k
    top_results = scored_results[:top_k]
    
    # Enrich results with document info from MongoDB
    for r in top_results:
        doc_id = r["documentId"]
        doc_info = await db.documents.find_one({"documentId": doc_id}) if doc_id else None
        r["filename"] = doc_info.get("filename", "Unknown") if doc_info else "Unknown"
    
    return top_results

