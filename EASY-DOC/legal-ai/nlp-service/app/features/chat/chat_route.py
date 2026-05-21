from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.features.chat.chat_service import chat_with_document

router = APIRouter()


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    document_id: str | None = Field(None, description="Optional document ID for context")


class ChatResponse(BaseModel):
    answer: str
    sources: list
    query: str
    document_id: str | None = None


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat endpoint with document context."""
    try:
        result = await chat_with_document(request.query, request.document_id)
        
        if isinstance(result, Exception):
            raise HTTPException(status_code=500, detail=str(result))
        
        return ChatResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")
