from pydantic import BaseModel
from typing import List, Optional


class Clause(BaseModel):
    type: str
    text: str
    start_pos: int
    end_pos: int
    confidence: float


class ClauseExtractionResult(BaseModel):
    document_id: str
    clauses: List[Clause]
    total_found: int
