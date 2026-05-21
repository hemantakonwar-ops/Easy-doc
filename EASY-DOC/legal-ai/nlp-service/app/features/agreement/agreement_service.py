from app.core.llm.provider import get_llm_response
from app.core.llm.prompt_builder import PromptBuilder

async def generate_agreement_text(prompt: str, context: str | None = None) -> dict:
    """Generate or modify agreement text using LLM."""
    
    system_instruction = "You are a legal assistant specialized in drafting contracts and agreements. Respond ONLY with the generated or modified text of the agreement. Do not include introductory or concluding conversational text."
    
    if context:
        full_prompt = f"{system_instruction}\n\nContext / Existing text:\n{context}\n\nUser Request:\n{prompt}"
    else:
        full_prompt = f"{system_instruction}\n\nUser Request:\n{prompt}"
        
    answer = await get_llm_response(full_prompt, temperature=0.7)
    
    return {
        "text": answer,
        "structuredData": {}
    }
