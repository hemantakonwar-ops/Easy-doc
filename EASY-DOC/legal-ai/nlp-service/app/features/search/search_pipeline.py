"""RAG Search Pipeline for document Q&A."""

from app.features.search.search_service import search_documents
from app.core.llm.provider import get_llm_response
from app.core.llm.prompt_builder import PromptBuilder


class SearchPipeline:
    """End-to-end RAG pipeline."""
    
    async def query(self, query: str, document_id: str | None = None) -> dict:
        """Execute full RAG pipeline."""
        # Step 1: Retrieve relevant context
        results = await search_documents(query, document_id, top_k=5)
        
        # Step 2: Build context string
        context = "\n\n".join([r["text"] for r in results])
        
        # Step 3: Generate response with LLM
        prompt = PromptBuilder.chat(context, query)
        answer = await get_llm_response(prompt)
        
        return {
            "answer": answer,
            "sources": results,
            "query": query
        }


# Singleton instance
search_pipeline = SearchPipeline()
