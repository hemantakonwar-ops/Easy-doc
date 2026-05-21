from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.features.simplify.simplify_service import simplify_legal_text

router = APIRouter()


class SimplifyRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=10000, description="Legal text to simplify")


class SimplifyResponse(BaseModel):
    original: str
    simplified: str


@router.post("/", response_model=SimplifyResponse)
async def simplify(request: SimplifyRequest):
    """Simplify legal text to plain English."""
    try:
        simplified = await simplify_legal_text(request.text)
        return SimplifyResponse(
            original=request.text[:500] + ("..." if len(request.text) > 500 else ""),
            simplified=simplified
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simplification failed: {str(e)}")
