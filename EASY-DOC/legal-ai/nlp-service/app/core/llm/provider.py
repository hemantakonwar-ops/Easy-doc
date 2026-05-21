import asyncio
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# Lazy initialization flags
_gemini_configured = False
_gemini_available = False
_groq_available = False


def _parse_api_keys(key_string: str | None) -> list[str]:
    """Parse comma-separated API keys."""
    if not key_string:
        return []
    keys = [k.strip() for k in key_string.split(",") if k.strip()]
    # Filter out placeholder keys
    real_keys = []
    for key in keys:
        lowered = key.lower()
        if not (
            lowered.startswith("your_")
            or lowered.endswith("_optional")
            or lowered in {"optional", "none", "null", "changeme", ""}
        ):
            real_keys.append(key)
    return real_keys


def _get_next_key(keys: list[str], key_index_name: str) -> str | None:
    """Get next key using round-robin."""
    if not keys:
        return None
    
    # Get current index from settings
    current_index = getattr(settings, key_index_name, 0)
    
    # Select key
    selected_key = keys[current_index % len(keys)]
    
    # Update index for next call
    setattr(settings, key_index_name, (current_index + 1) % len(keys))
    
    return selected_key


def _configure_gemini():
    global _gemini_configured, _gemini_available
    if _gemini_configured:
        return _gemini_available
    
    _gemini_configured = True
    gemini_keys = _parse_api_keys(settings.gemini_api_key)
    
    if not gemini_keys:
        logger.warning("Gemini API key not configured")
        return False
    
    try:
        from google import genai  # noqa: F401
        logger.info(f"Gemini configured successfully with {len(gemini_keys)} key(s)")
        _gemini_available = True
        return True
    except Exception as e:
        logger.warning(f"Gemini unavailable. Install google-genai: {e}")
        return False


def _configure_groq():
    global _groq_available
    if _groq_available:
        return True

    groq_keys = _parse_api_keys(settings.groq_api_key)
    
    if not groq_keys:
        logger.warning("Groq API key not configured")
        return False

    try:
        import groq  # noqa: F401
        logger.info(f"Groq configured successfully with {len(groq_keys)} key(s)")
        _groq_available = True
        return True
    except Exception as e:
        logger.error(f"Failed to configure Groq: {e}")
        return False


async def _call_groq(prompt: str, temperature: float) -> str:
    """Call Groq API with round-robin key selection."""
    from groq import Groq
    
    groq_keys = _parse_api_keys(settings.groq_api_key)
    if not groq_keys:
        raise ValueError("No Groq API keys available")
    
    api_key = _get_next_key(groq_keys, "_groq_key_index")
    
    client = Groq(api_key=api_key)
    response = await asyncio.get_event_loop().run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model=settings.groq_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=2048,
        )
    )
    content = response.choices[0].message.content
    if not content:
        raise ValueError("Groq returned an empty response")
    return content


async def _call_gemini(prompt: str, temperature: float) -> str:
    """Call Gemini API with round-robin key selection."""
    from google import genai
    from google.genai import types
    
    gemini_keys = _parse_api_keys(settings.gemini_api_key)
    if not gemini_keys:
        raise ValueError("No Gemini API keys available")
    
    api_key = _get_next_key(gemini_keys, "_gemini_key_index")
    
    client = genai.Client(api_key=api_key)
    response = await asyncio.get_event_loop().run_in_executor(
        None,
        lambda: client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=temperature,
                max_output_tokens=4096,
            ),
        ),
    )
    
    # Extract text from response
    text = getattr(response, "text", None)
    if text:
        return text
    
    candidates = getattr(response, "candidates", None) or []
    if candidates:
        parts = getattr(candidates[0].content, "parts", []) or []
        joined = "".join(getattr(part, "text", "") for part in parts).strip()
        if joined:
            return joined
    
    raise ValueError("Gemini returned an empty response")


async def get_llm_response(prompt: str, temperature: float = 0.7, max_retries: int = 2) -> str:
    """Get response from LLM with Groq first approach, fallback to Gemini.
    
    Multiple API keys are supported (comma-separated) with round-robin selection.
    Example: GROQ_API_KEY="key1,key2,key3"
    """
    errors = []
    timeout_seconds = 10.0
    
    # Try Groq first (primary provider)
    if _configure_groq():
        groq_keys = _parse_api_keys(settings.groq_api_key)
        for key_idx in range(min(len(groq_keys), max_retries + 1)):
            for attempt in range(max_retries):
                try:
                    logger.info(f"Trying Groq (key {key_idx + 1}/{len(groq_keys)}, attempt {attempt + 1})")
                    result = await asyncio.wait_for(_call_groq(prompt, temperature), timeout=timeout_seconds)
                    logger.info("Groq succeeded")
                    return result
                except asyncio.TimeoutError:
                    err_msg = f"Groq key {key_idx + 1} attempt {attempt + 1} timed out after {timeout_seconds}s"
                    logger.warning(err_msg)
                    errors.append(err_msg)
                except Exception as e:
                    err_msg = f"Groq key {key_idx + 1} attempt {attempt + 1} failed: {e}"
                    logger.warning(err_msg)
                    errors.append(err_msg)
                    if attempt < max_retries - 1:
                        await asyncio.sleep(1)
    
    # Fallback to Gemini
    if _configure_gemini():
        gemini_keys = _parse_api_keys(settings.gemini_api_key)
        for key_idx in range(min(len(gemini_keys), max_retries + 1)):
            for attempt in range(max_retries):
                try:
                    logger.info(f"Trying Gemini fallback (key {key_idx + 1}/{len(gemini_keys)}, attempt {attempt + 1})")
                    result = await asyncio.wait_for(_call_gemini(prompt, temperature), timeout=timeout_seconds)
                    logger.info("Gemini fallback succeeded")
                    return result
                except asyncio.TimeoutError:
                    err_msg = f"Gemini key {key_idx + 1} attempt {attempt + 1} timed out after {timeout_seconds}s"
                    logger.warning(err_msg)
                    errors.append(err_msg)
                except Exception as e:
                    err_msg = f"Gemini key {key_idx + 1} attempt {attempt + 1} failed: {e}"
                    logger.warning(err_msg)
                    errors.append(err_msg)
                    if attempt < max_retries - 1:
                        await asyncio.sleep(1)
    
    # All providers failed
    error_summary = "\n".join(errors)
    logger.error(f"All LLM providers failed:\n{error_summary}")
    return f"Unable to generate response. All AI providers are currently unavailable. Please try again later."



async def simplify_text(text: str) -> str:
    """Simplify legal text to plain English."""
    from app.core.llm.prompt_builder import PromptBuilder
    prompt = PromptBuilder.simplify(text[:8000])
    return await get_llm_response(prompt, temperature=0.3)


async def batch_process(prompts: list, temperature: float = 0.7) -> list:
    """Process multiple prompts in parallel."""
    tasks = [get_llm_response(p, temperature) for p in prompts]
    return await asyncio.gather(*tasks, return_exceptions=True)
