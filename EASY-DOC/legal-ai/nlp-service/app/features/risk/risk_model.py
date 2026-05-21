from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class RiskFlag(BaseModel):
    type: str
    term: str
    severity: str = Field(..., pattern="^(low|medium|high)$")
    context: Optional[str] = None


class RiskRequest(BaseModel):
    document_id: str


class RiskResponse(BaseModel):
    risk_score: int = Field(..., ge=0, le=100)
    flags: List[RiskFlag]
    summary: str
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)


class RiskAnalysisResult(BaseModel):
    document_id: str
    score: int
    flags: List[dict]
    llm_summary: str
    processing_time_ms: Optional[float] = None
