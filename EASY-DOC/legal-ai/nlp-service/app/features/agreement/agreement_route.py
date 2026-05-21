from fastapi import APIRouter
from pydantic import BaseModel
from app.features.agreement.agreement_service import generate_agreement_text

router = APIRouter()

class GenerateRequest(BaseModel):
    prompt: str
    context: str | None = None

@router.post("/generate")
async def generate(request: GenerateRequest):
    return await generate_agreement_text(request.prompt, request.context)
