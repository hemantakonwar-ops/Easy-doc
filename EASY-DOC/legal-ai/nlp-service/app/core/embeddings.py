"""
Embedding Service.

Provides a centralized embedding generation service using SentenceTransformers.
Used by RAG, search, parsing, and dataset training pipelines.
"""
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import List

import numpy as np
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

_executor = ThreadPoolExecutor(max_workers=4)


class EmbeddingService:
    """Sentence-transformer based embedding service."""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()
        logger.info(f"Embedding model loaded: {model_name} (dim={self.dimension})")

    def encode_sync(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """Generate embeddings synchronously (CPU-bound)."""
        return self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=False,
            convert_to_numpy=True,
        )

    def encode_query_sync(self, text: str) -> List[float]:
        """Generate embedding for a single query string."""
        return self.model.encode(text).tolist()

    async def encode(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """Generate embeddings asynchronously in batches."""
        loop = asyncio.get_event_loop()

        # Split into batches
        batches = [texts[i : i + batch_size] for i in range(0, len(texts), batch_size)]

        # Process each batch in the thread pool
        tasks = [
            loop.run_in_executor(_executor, self.encode_sync, batch)
            for batch in batches
        ]
        results = await asyncio.gather(*tasks)

        # Flatten results
        all_embeddings = []
        for batch_result in results:
            all_embeddings.extend(batch_result.tolist())
        return all_embeddings

    async def encode_query(self, text: str) -> List[float]:
        """Generate embedding for a single query asynchronously."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(_executor, self.encode_query_sync, text)


# Singleton instance
_embedding_service = None


def get_embedding_service() -> EmbeddingService:
    """Get or create the singleton EmbeddingService."""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
