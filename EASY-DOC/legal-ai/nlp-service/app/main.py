from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.connection import connect_db, close_db
from app.features.parsing import parsing_route
from app.features.simplify import simplify_route
from app.features.embedding import embedding_route
from app.features.search import search_route
from app.features.chat import chat_route
from app.features.risk import risk_route
from app.features.clause import clause_route
from app.features.laws import laws_route
from app.features.agreement import agreement_route


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="Legal AI NLP Service",
    description="Document Intelligence + RAG + LLM API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(parsing_route.router, prefix="/parse", tags=["parsing"])
app.include_router(embedding_route.router, prefix="/embed", tags=["embedding"])
app.include_router(search_route.router, prefix="/search", tags=["search"])
app.include_router(chat_route.router, prefix="/chat", tags=["chat"])
app.include_router(risk_route.router, prefix="/risk", tags=["risk"])
app.include_router(simplify_route.router, prefix="/simplify", tags=["simplify"])
app.include_router(clause_route.router, prefix="/clause", tags=["clause"])
app.include_router(laws_route.router, prefix="/laws", tags=["laws"])
app.include_router(agreement_route.router, prefix="/agreement", tags=["agreement"])



@app.get("/health")
async def health_check():
    from app.db.connection import health_check as db_health
    db_status = await db_health()
    return {
        "status": "healthy",
        "service": "nlp-service",
        "database": "connected" if db_status else "disconnected",
        "mode": "full" if db_status else "limited"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
