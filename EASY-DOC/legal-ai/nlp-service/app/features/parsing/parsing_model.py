from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ParseRequest(BaseModel):
    filename: str
    content_type: Optional[str] = "application/pdf"


class ParseResponse(BaseModel):
    document_id: str
    filename: str
    is_scanned: bool
    chunk_count: int
    text_length: int


class DocumentChunk(BaseModel):
    index: int
    text: str
    embedding: Optional[List[float]] = None


class ParsedDocument(BaseModel):
    document_id: str
    filename: str
    text: str
    chunks: List[DocumentChunk]
    is_scanned: bool
    created_at: datetime = Field(default_factory=datetime.utcnow)
