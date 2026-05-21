from pydantic import BaseModel
from typing import List


class EmbedRequest(BaseModel):
    texts: List[str]
    document_id: str


class EmbedResponse(BaseModel):
    status: str
    count: int
    document_id: str


class Embedding(BaseModel):
    text: str
    vector: List[float]
    document_id: str
