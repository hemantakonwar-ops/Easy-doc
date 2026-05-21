from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class DocumentMetadata(BaseModel):
    document_id: str
    filename: str
    page_count: Optional[int] = None
    is_scanned: bool = False
    parsed_at: datetime = Field(default_factory=datetime.utcnow)


class Document(BaseModel):
    document_id: str
    filename: str
    text: str
    chunks: List[str]
    metadata: DocumentMetadata
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Chunk(BaseModel):
    chunk_id: str
    document_id: str
    text: str
    embedding: Optional[List[float]] = None
    index: int
