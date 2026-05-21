"""
ChromaDB Vector Database Service.

Provides persistent vector storage for legal document embeddings,
replacing the file-based FAISS index with a scalable, persistent solution.
"""
import logging
from typing import List, Dict, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

# Lazy-loaded singleton
_vector_db = None


class VectorDB:
    """ChromaDB-backed vector store for legal document embeddings."""

    def __init__(self, persist_dir: str = "./chroma_db"):
        import chromadb

        self.persist_dir = persist_dir
        Path(persist_dir).mkdir(parents=True, exist_ok=True)

        self.client = chromadb.PersistentClient(path=persist_dir)
        self.collection = self.client.get_or_create_collection(
            name="legal_documents",
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(
            f"ChromaDB initialized at {persist_dir} "
            f"({self.collection.count()} vectors)"
        )

    def add_documents(
        self,
        documents: List[str],
        embeddings: List[List[float]],
        ids: List[str],
        metadatas: Optional[List[Dict]] = None,
    ):
        """Add documents with embeddings to the vector store."""
        if not documents:
            return

        self.collection.upsert(
            embeddings=embeddings,
            documents=documents,
            ids=ids,
            metadatas=metadatas,
        )
        logger.info(f"Stored {len(documents)} vectors in ChromaDB")

    def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        where_filter: Optional[Dict] = None,
    ) -> List[Dict]:
        """Search for similar documents using cosine similarity."""
        if self.collection.count() == 0:
            return []

        query_params = {
            "query_embeddings": [query_embedding],
            "n_results": min(top_k, self.collection.count()),
        }
        if where_filter:
            query_params["where"] = where_filter

        results = self.collection.query(**query_params)

        formatted = []
        if results and results["ids"] and results["ids"][0]:
            for i in range(len(results["ids"][0])):
                distance = results["distances"][0][i] if results.get("distances") else 0
                # ChromaDB cosine distance: 0 = identical, 2 = opposite
                # Convert to similarity score: 1 - (distance / 2)
                score = 1 - (distance / 2)

                formatted.append({
                    "id": results["ids"][0][i],
                    "text": results["documents"][0][i] if results.get("documents") else "",
                    "metadata": results["metadatas"][0][i] if results.get("metadatas") else {},
                    "score": score,
                })

        return formatted

    def delete_document(self, document_id: str):
        """Delete all chunks for a specific document."""
        try:
            self.collection.delete(where={"document_id": document_id})
            logger.info(f"Deleted vectors for document {document_id}")
        except Exception as e:
            logger.warning(f"Failed to delete vectors for {document_id}: {e}")

    def count(self) -> int:
        """Get total number of vectors stored."""
        return self.collection.count()


def get_vector_db() -> VectorDB:
    """Get or create the singleton VectorDB instance."""
    global _vector_db
    if _vector_db is None:
        from app.core.config import settings
        persist_dir = getattr(settings, "vector_db_path", "./chroma_db")
        _vector_db = VectorDB(persist_dir=persist_dir)
    return _vector_db
