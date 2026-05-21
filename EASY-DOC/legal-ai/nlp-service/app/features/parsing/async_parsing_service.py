"""
Async PDF Parsing Service.

Provides non-blocking PDF processing with job tracking.
Uploads return immediately with a job_id; clients poll for status.
"""
import asyncio
import uuid
import os
import logging
from datetime import datetime, timezone
from typing import Optional, Dict

logger = logging.getLogger(__name__)


class AsyncParsingService:
    """In-memory async job queue for PDF parsing."""

    MAX_CONCURRENT_JOBS = 4

    def __init__(self):
        self.jobs: Dict[str, dict] = {}
        self._semaphore = asyncio.Semaphore(self.MAX_CONCURRENT_JOBS)

    async def start_parsing(
        self, file_path: str, filename: str
    ) -> str:
        """Queue a PDF for background parsing. Returns job_id immediately."""
        job_id = str(uuid.uuid4())
        self.jobs[job_id] = {
            "job_id": job_id,
            "status": "queued",
            "progress": 0,
            "filename": filename,
            "file_path": file_path,
            "result": None,
            "error": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": None,
        }

        # Fire-and-forget background task
        asyncio.create_task(self._process_pdf(job_id))
        return job_id

    async def _process_pdf(self, job_id: str):
        """Background worker: parse → chunk → embed → store."""
        async with self._semaphore:
            job = self.jobs[job_id]
            job["status"] = "processing"
            job["progress"] = 5

            try:
                file_path = job["file_path"]
                filename = job["filename"]

                # --- Step 1: Extract text ---
                job["progress"] = 10
                logger.info(f"[{job_id}] Extracting text from {filename}")

                from app.features.parsing.parsing_service import parse_document

                with open(file_path, "rb") as f:
                    content = f.read()

                result = await parse_document(content, filename)
                if not result or not result.get("text"):
                    raise ValueError("No text could be extracted from the PDF")

                job["progress"] = 50

                # --- Step 2: Generate & store embeddings ---
                logger.info(f"[{job_id}] Generating embeddings for {filename}")
                chunks = result.get("chunks", [])
                doc_id = str(uuid.uuid4())

                if chunks:
                    from app.core.embeddings import get_embedding_service
                    from app.core.vector_db import get_vector_db

                    embedding_svc = get_embedding_service()
                    vector_db = get_vector_db()

                    job["progress"] = 60
                    embeddings = await embedding_svc.encode(chunks)

                    job["progress"] = 80
                    ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
                    metadatas = [
                        {
                            "document_id": doc_id,
                            "filename": filename,
                            "chunk_index": i,
                            "source": filename,
                        }
                        for i in range(len(chunks))
                    ]
                    vector_db.add_documents(
                        documents=chunks,
                        embeddings=embeddings,
                        ids=ids,
                        metadatas=metadatas,
                    )

                job["progress"] = 100
                job["status"] = "completed"
                job["completed_at"] = datetime.now(timezone.utc).isoformat()
                job["result"] = {
                    "document_id": doc_id,
                    "filename": filename,
                    "total_pages": result.get("total_pages", 0),
                    "text_length": len(result.get("text", "")),
                    "chunk_count": len(chunks),
                    "text": result.get("text", ""),
                    "chunks": chunks,
                    "document_type": result.get("document_type", "unknown"),
                    "metadata": result.get("metadata", {}),
                }
                logger.info(
                    f"[{job_id}] Completed: {filename} → {doc_id} "
                    f"({len(chunks)} chunks)"
                )

            except Exception as e:
                logger.error(f"[{job_id}] Failed: {e}", exc_info=True)
                job["status"] = "failed"
                job["error"] = str(e)
                job["completed_at"] = datetime.now(timezone.utc).isoformat()

    async def get_status(self, job_id: str) -> Optional[dict]:
        """Get the current status of a parsing job."""
        return self.jobs.get(job_id)

    def cleanup_old_jobs(self, max_age_hours: int = 24):
        """Remove completed/failed jobs older than max_age_hours."""
        now = datetime.now(timezone.utc)
        to_delete = []
        for jid, job in self.jobs.items():
            completed = job.get("completed_at")
            if completed:
                from datetime import timedelta

                completed_dt = datetime.fromisoformat(completed)
                if (now - completed_dt).total_seconds() > max_age_hours * 3600:
                    to_delete.append(jid)
        for jid in to_delete:
            # Clean up file
            try:
                fp = self.jobs[jid].get("file_path")
                if fp and os.path.exists(fp):
                    os.remove(fp)
            except Exception:
                pass
            del self.jobs[jid]


# Singleton
_parsing_service = None


def get_async_parsing_service() -> AsyncParsingService:
    """Get or create the singleton AsyncParsingService."""
    global _parsing_service
    if _parsing_service is None:
        _parsing_service = AsyncParsingService()
    return _parsing_service
