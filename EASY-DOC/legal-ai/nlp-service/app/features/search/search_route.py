from fastapi import APIRouter
from pydantic import BaseModel
from app.features.search.search_service import search_documents

router = APIRouter()


class SearchRequest(BaseModel):
    query: str
    document_id: str | None = None
    top_k: int = 5


class SearchResponse(BaseModel):
    results: list
    query: str


@router.post("/", response_model=SearchResponse)
async def search(request: SearchRequest):
    results = await search_documents(
        request.query, 
        request.document_id, 
        request.top_k
    )
    return SearchResponse(results=results, query=request.query)
