import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any
from app.db.connection import get_db
from app.core.llm.provider import get_llm_response

_executor = ThreadPoolExecutor(max_workers=2)

RISK_KEYWORDS = {
    "unlimited liability": "high",
    "indemnify": "high",
    "indemnification": "high",
    "hold harmless": "high",
    "terminate at will": "high",
    "sole discretion": "medium",
    "no warranty": "medium",
    "waiver of rights": "high",
    "binding arbitration": "medium",
    "non-compete": "medium",
    "confidentiality": "low",
    "liquidated damages": "medium",
}


async def analyze_risk(document_id: str) -> dict:
    """Analyze legal risks with parallel rule-based and LLM analysis."""
    db = get_db()
    
    # Fetch document from MongoDB - use documentId (camelCase) to match Node.js schema
    doc = await db.documents.find_one({"documentId": document_id})
    if not doc:
        return {"risk_score": 0, "flags": [], "summary": "Document not found"}
    
    text = doc.get("text", "")
    
    # Run rule-based and LLM analysis in parallel
    rule_task = asyncio.create_task(_analyze_keywords_parallel(text))
    llm_task = asyncio.create_task(llm_risk_analysis(text[:4000]))
    
    flags, risk_summary = await asyncio.gather(rule_task, llm_task)
    
    # Calculate score
    score = calculate_risk_score(flags, risk_summary)
    
    return {
        "risk_score": score,
        "flags": flags,
        "summary": risk_summary
    }


async def _analyze_keywords_parallel(text: str) -> List[Dict[str, Any]]:
    """Analyze keywords in parallel chunks."""
    text_lower = text.lower()
    
    # Process keywords in parallel batches
    loop = asyncio.get_event_loop()
    tasks = [
        loop.run_in_executor(_executor, _check_keyword, keyword, severity, text_lower)
        for keyword, severity in RISK_KEYWORDS.items()
    ]
    results = await asyncio.gather(*tasks)
    
    # Filter out None results
    return [r for r in results if r is not None]


def _check_keyword(keyword: str, severity: str, text: str) -> Dict[str, Any] | None:
    """Check if keyword exists in text."""
    if keyword in text:
        return {
            "type": "keyword_match",
            "term": keyword,
            "severity": severity
        }
    return None


async def llm_risk_analysis(text: str) -> str:
    """Use LLM for comprehensive risk analysis."""
    prompt = f"""Analyze this legal document for risks and summarize key concerns:

{text}

Provide a brief risk summary:"""
    
    return await get_llm_response(prompt, temperature=0.2)


def calculate_risk_score(flags: List[Dict[str, Any]], summary: str) -> int:
    """Calculate risk score based on flags."""
    score = 30  # Base score
    
    severity_weights = {"high": 20, "medium": 10, "low": 5}
    
    for flag in flags:
        score += severity_weights.get(flag.get("severity", "low"), 5)
    
    # Cap at 100
    return min(score, 100)
