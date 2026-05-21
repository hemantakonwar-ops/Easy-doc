from fastapi import APIRouter
from pydantic import BaseModel
from app.features.clause.clause_service import extract_clauses as extract_clauses_service

router = APIRouter()


class ClauseRequest(BaseModel):
    document_id: str
    clause_types: list | None = None


@router.post("/")
async def extract_clauses(request: ClauseRequest):
    result = await extract_clauses_service(request.document_id, request.clause_types)
    return result
