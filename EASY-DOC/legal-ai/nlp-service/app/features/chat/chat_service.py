import asyncio
from app.features.search.search_service import search_documents
from app.core.llm.provider import get_llm_response
from app.core.llm.prompt_builder import PromptBuilder
from app.db.connection import get_db


async def chat_with_document(query: str, document_id: str | None = None) -> dict:
    """Chat with document using RAG with parallel processing and strict context guards."""
    
    # Retrieve relevant context (threshold filtering is applied in search_service)
    results = await search_documents(query, document_id, top_k=5)
    
    # Context Guard Layer: Bypass LLM if no results meet the threshold
    if not results:
        return {
            "answer": "Not found in document. The information requested could not be found with a high enough confidence score.",
            "sources": [],
            "query": query,
            "document_id": document_id
        }
    
    # Build context from search results with citations
    context_chunks = []
    for r in results:
        snippet = r.get('text', '')
        # Truncate extremely long chunks to prevent context window overflow
        if len(snippet) > 1500:
            snippet = snippet[:1500] + "..."
        context_chunks.append(f"[Source: {r.get('filename', 'Unknown')}]\n{snippet}")
        
    context = "\n\n".join(context_chunks)
    
    # Safety truncation for the entire context block (~8000 chars roughly)
    if len(context) > 12000:
        context = context[:12000] + "\n...[Context truncated due to length]"
    
    # Get document info if available
    doc_info = None
    if document_id:
        db = get_db()
        doc_info = await db.documents.find_one({"documentId": document_id})
    
    # Generate response with structured prompt
    prompt = PromptBuilder.chat(context, query)
    answer = await get_llm_response(prompt, temperature=0.1)  # Lower temperature for stricter grounding
    
    return {
        "answer": answer,
        "sources": results,
        "query": query,
        "document_id": document_id
    }


async def batch_chat(queries: list, document_id: str | None = None) -> list:
    """Process multiple chat queries in parallel."""
    tasks = [chat_with_document(q, document_id) for q in queries]
    return await asyncio.gather(*tasks, return_exceptions=True)
