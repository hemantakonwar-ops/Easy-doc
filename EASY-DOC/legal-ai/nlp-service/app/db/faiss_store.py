import asyncio
import numpy as np
import faiss
import pickle
from pathlib import Path
from typing import List, Tuple
from concurrent.futures import ThreadPoolExecutor
from app.core.config import settings

# Global index and metadata
_index = None
_metadata = {}
_lock = asyncio.Lock()
_executor = ThreadPoolExecutor(max_workers=2)


def _get_index():
    global _index
    if _index is None:
        dim = 384  # all-MiniLM-L6-v2 dimension
        _index = faiss.IndexFlatIP(dim)  # Inner product for cosine similarity
    return _index


async def add_embeddings(document_id: str, texts: List[str], embeddings: List[List[float]]):
    """Add embeddings to FAISS index (thread-safe)."""
    async with _lock:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(_executor, _add_embeddings_sync, document_id, texts, embeddings)


def _add_embeddings_sync(document_id: str, texts: List[str], embeddings: List[List[float]]):
    """Synchronous FAISS index update."""
    index = _get_index()
    
    # Convert to numpy array
    vectors = np.array(embeddings, dtype=np.float32)
    
    # Normalize for cosine similarity
    faiss.normalize_L2(vectors)
    
    # Add to index
    start_idx = index.ntotal
    index.add(vectors)
    
    # Store metadata
    for i, text in enumerate(texts):
        _metadata[start_idx + i] = {
            "text": text,
            "document_id": document_id
        }
    
    # Persist
    _save_index()


async def search_similar(query_embedding: List[float], k: int = 5) -> List[Tuple[str, float, str]]:
    """Search for similar texts (thread-safe)."""
    async with _lock:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(_executor, _search_sync, query_embedding, k)


def _search_sync(query_embedding: List[float], k: int) -> List[Tuple[str, float, str]]:
    """Synchronous FAISS search."""
    index = _get_index()
    
    if index.ntotal == 0:
        return []
    
    # Normalize query
    query_vector = np.array([query_embedding], dtype=np.float32)
    faiss.normalize_L2(query_vector)
    
    # Search
    scores, indices = index.search(query_vector, min(k, index.ntotal))
    
    # Get results with document_id
    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx in _metadata and idx >= 0:
            results.append((_metadata[idx]["text"], float(score), _metadata[idx]["document_id"]))
    
    return results


async def search_similar_by_document(query_embedding: List[float], document_id: str, k: int = 5) -> List[Tuple[str, float, str]]:
    """Search for similar texts within a specific document."""
    async with _lock:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(_executor, _search_by_document_sync, query_embedding, document_id, k)


def _search_by_document_sync(query_embedding: List[float], document_id: str, k: int) -> List[Tuple[str, float, str]]:
    """Synchronous FAISS search filtered by document."""
    index = _get_index()
    
    if index.ntotal == 0:
        return []
    
    # Normalize query
    query_vector = np.array([query_embedding], dtype=np.float32)
    faiss.normalize_L2(query_vector)
    
    # Search for more results to filter
    search_k = min(k * 3, index.ntotal)  # Get more to filter
    scores, indices = index.search(query_vector, search_k)
    
    # Filter by document_id
    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx in _metadata and idx >= 0:
            meta = _metadata[idx]
            if meta.get("document_id") == document_id:
                results.append((meta["text"], float(score), meta["document_id"]))
                if len(results) >= k:
                    break
    
    return results


def _save_index():
    """Save FAISS index and metadata to disk."""
    path = Path(settings.faiss_index_path)
    path.mkdir(parents=True, exist_ok=True)
    
    faiss.write_index(_get_index(), str(path / "index.faiss"))
    with open(path / "metadata.pkl", "wb") as f:
        pickle.dump(_metadata, f)


def load_index():
    """Load FAISS index and metadata from disk."""
    global _index, _metadata
    
    path = Path(settings.faiss_index_path)
    index_file = path / "index.faiss"
    metadata_file = path / "metadata.pkl"
    
    if index_file.exists():
        _index = faiss.read_index(str(index_file))
    
    if metadata_file.exists():
        with open(metadata_file, "rb") as f:
            _metadata = pickle.load(f)
