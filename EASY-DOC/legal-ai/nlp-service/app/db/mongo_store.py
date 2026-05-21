from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Try to connect, but continue without DB if unavailable
try:
    client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=2000)
    db = client.legal_ai
except Exception as e:
    logger.warning(f"MongoDB not available: {e}")
    client = None
    db = None


async def store_document(document_id: str, data: dict):
    """Store document in MongoDB if available."""
    if db is None:
        logger.debug("MongoDB not available, skipping document store")
        return
    try:
        await db.documents.update_one(
            {"document_id": document_id},
            {"$set": data},
            upsert=True
        )
    except Exception as e:
        logger.error(f"Failed to store document: {e}")


async def get_document(document_id: str) -> dict | None:
    """Retrieve document from MongoDB if available."""
    if db is None:
        return None
    try:
        return await db.documents.find_one({"document_id": document_id})
    except Exception as e:
        logger.error(f"Failed to get document: {e}")
        return None


async def delete_document(document_id: str):
    """Delete document from MongoDB if available."""
    if db is None:
        return
    try:
        await db.documents.delete_one({"document_id": document_id})
    except Exception as e:
        logger.error(f"Failed to delete document: {e}")
