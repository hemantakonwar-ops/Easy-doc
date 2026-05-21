import re
from typing import List
from app.db.connection import get_db

CLAUSE_PATTERNS = {
    "liability": r"(liability|indemnif|hold harmless|warrant|guarantee)",
    "termination": r"(terminat|cancel|breach|default|suspension)",
    "payment": r"(payment|fee|price|cost|expense|compensation)",
    "confidentiality": r"(confidential|non-disclosure|nda|secret|proprietary)",
    "intellectual_property": r"(intellectual property|ip|patent|trademark|copyright)",
}


async def extract_clauses(document_id: str, clause_types: List[str] | None = None):
    """Extract legal clauses from document."""
    db = get_db()
    # Node.js saves the document with the 'documentId' field, not 'document_id'
    doc = await db.documents.find_one({"documentId": document_id})
    
    if not doc:
        # Fallback for documents created directly by Python
        doc = await db.documents.find_one({"document_id": document_id})
        
    if not doc:
        return {"error": "Document not found"}
    
    text = doc.get("text", "")
    types_to_search = clause_types or list(CLAUSE_PATTERNS.keys())
    
    clauses = []
    for clause_type in types_to_search:
        if clause_type in CLAUSE_PATTERNS:
            pattern = CLAUSE_PATTERNS[clause_type]
            matches = list(re.finditer(pattern, text, re.IGNORECASE))
            
            for match in matches:
                # Extract surrounding context (200 chars before and after)
                start = max(0, match.start() - 200)
                end = min(len(text), match.end() + 200)
                context = text[start:end]
                
                clauses.append({
                    "type": clause_type,
                    "text": context,
                    "matched_term": match.group(),
                    "position": match.start()
                })
    
    return {
        "document_id": document_id,
        "clauses": clauses,
        "total_found": len(clauses)
    }
