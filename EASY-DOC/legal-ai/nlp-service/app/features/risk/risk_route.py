from fastapi import APIRouter
from pydantic import BaseModel
from app.features.risk.risk_service import analyze_risk

router = APIRouter()


class RiskRequest(BaseModel):
    document_id: str


class RiskResponse(BaseModel):
    risk_score: int
    flags: list
    summary: str


@router.post("/", response_model=RiskResponse)
async def risk_analysis(request: RiskRequest):
    result = await analyze_risk(request.document_id)
    return RiskResponse(**result)
