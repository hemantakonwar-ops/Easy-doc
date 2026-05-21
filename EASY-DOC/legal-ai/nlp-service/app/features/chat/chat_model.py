from pydantic import BaseModel
from typing import List, Optional


class ChatRequest(BaseModel):
    query: str
    document_id: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    sources: List[dict]


class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: Optional[str] = None
