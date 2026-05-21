from pydantic import BaseModel


class SimplifyRequest(BaseModel):
    text: str


class SimplifyResponse(BaseModel):
    original: str
    simplified: str
