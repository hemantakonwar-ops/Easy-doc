from app.core.llm.provider import get_llm_response
from app.core.llm.prompt_builder import PromptBuilder


async def simplify_legal_text(text: str) -> str:
    """Simplify legal text using LLM."""
    prompt = PromptBuilder.simplify(text[:8000])  # Limit input size
    return await get_llm_response(prompt, temperature=0.3)


async def simplify_batch(texts: list) -> list:
    """Simplify multiple texts in parallel."""
    import asyncio
    tasks = [simplify_legal_text(text) for text in texts]
    return await asyncio.gather(*tasks, return_exceptions=True)
