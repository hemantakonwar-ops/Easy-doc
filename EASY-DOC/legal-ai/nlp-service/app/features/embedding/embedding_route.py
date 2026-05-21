from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.features.embedding.embedding_service import embed_texts, store_embeddings

router = APIRouter()


class EmbedRequest(BaseModel):
    texts: List[str]
    document_id: str


class EmbedResponse(BaseModel):
    status: str
    count: int
    document_id: str


@router.post("/", response_model=EmbedResponse)
async def create_embeddings(request: EmbedRequest):
    embeddings = await embed_texts(request.texts)
    await store_embeddings(request.document_id, request.texts, embeddings)
    
    return EmbedResponse(
        status="success",
        count=len(embeddings),
        document_id=request.document_id
    )
