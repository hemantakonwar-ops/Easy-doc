from fastapi import APIRouter, UploadFile, File, HTTPException
from app.features.parsing.parsing_service import parse_document
from app.features.parsing.parsing_parallel import parse_document_parallel
from app.features.parsing.async_parsing_service import get_async_parsing_service
import uuid
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/upload-pdf")
async def upload_pdf_async(file: UploadFile = File(...)):
    """Upload a PDF for async background processing.

    Returns a job_id immediately. Client polls /status/{job_id} for progress.
    """

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    contents = await file.read()

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    if len(contents) > 20 * 1024 * 1024:  # 20 MB limit
        raise HTTPException(status_code=400, detail="File size exceeds 20MB limit")

    os.makedirs("uploads", exist_ok=True)
    temp_id = str(uuid.uuid4())
    file_path = f"uploads/{temp_id}.pdf"
    with open(file_path, "wb") as f:
        f.write(contents)
    svc = get_async_parsing_service()
    job_id = await svc.start_parsing(file_path, file.filename)

    return {
        "success": True,
        "job_id": job_id,
        "status": "processing",
        "message": "PDF uploaded and queued for processing",
    }


@router.get("/status/{job_id}")
async def get_parse_status(job_id: str):
    """Poll the status of an async parsing job."""
    svc = get_async_parsing_service()
    status = await svc.get_status(job_id)
    if not status:
        raise HTTPException(status_code=404, detail="Job not found")
    return status


@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    """Upload and parse PDF with parallel processing (synchronous)."""
    try:
    
        if not file.filename or not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        content = await file.read()
        
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        if len(content) > 20 * 1024 * 1024:  # 20MB limit (unified)
            raise HTTPException(status_code=400, detail="File size exceeds 20MB limit")
        
        logger.info(f"Processing upload: {file.filename} ({len(content)} bytes)")
        
        result = await parse_document_parallel(content, file.filename)
        
        if not result or not result.get("text"):
            logger.warning(f"No text extracted from {file.filename}")
        
        doc_id = str(uuid.uuid4())
        
        logger.info(f"Skipping embeddings in sync parse for {file.filename} - use async endpoint for full pipeline")
        
        logger.info(f"Successfully processed {file.filename} -> {doc_id}")
        
        return {
            "document_id": doc_id,
            "filename": file.filename,
            "document_type": result.get("document_type", "unknown"),
            "chunk_count": result.get("chunk_count", 0),
            "text_length": len(result.get("text", "")),
            "text": result.get("text", ""),
            "chunks": result.get("chunks", []),
            "total_pages": result.get("total_pages", 0),
            "page_count": result.get("page_count", 0),
            "confidence": result.get("confidence", 0),
            "metadata": result.get("metadata", {})
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed for {file.filename}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")


@router.post("/benchmark")
async def benchmark_parsing(file: UploadFile = File(...)):
    """Benchmark sequential vs parallel parsing performance."""
    import time
    
    try:
        content = await file.read()
        
        if len(content) > 5 * 1024 * 1024: 
            raise HTTPException(status_code=400, detail="File too large for benchmark (max 5MB)")
        
        results = {}
        logger.info(f"Benchmarking PARALLEL parsing for {file.filename}")
        start = time.time()
        parallel_result = await parse_document_parallel(content, file.filename)
        parallel_time = time.time() - start
        results["parallel"] = {
            "time_seconds": round(parallel_time, 2),
            "pages": parallel_result.get("total_pages", 0),
            "chunks": parallel_result.get("chunk_count", 0),
            "speed": round(parallel_result.get("total_pages", 0) / parallel_time, 2) if parallel_time > 0 else 0
        }
        
        # Test sequential parsing (only if file is small)
        if len(content) < 1 * 1024 * 1024:  # Only for files < 1MB
            logger.info(f"Benchmarking SEQUENTIAL parsing for {file.filename}")
            start = time.time()
            sequential_result = await parse_document(content, file.filename)
            sequential_time = time.time() - start
            results["sequential"] = {
                "time_seconds": round(sequential_time, 2),
                "pages": sequential_result.get("total_pages", 0),
                "chunks": sequential_result.get("chunk_count", 0),
                "speed": round(sequential_result.get("total_pages", 0) / sequential_time, 2) if sequential_time > 0 else 0
            }
            
            speedup = sequential_time / parallel_time if parallel_time > 0 else 1
            results["speedup_factor"] = round(speedup, 2)
            results["time_saved_seconds"] = round(sequential_time - parallel_time, 2)
        else:
            results["sequential"] = {"skipped": "File too large for sequential test"}
        
        return {
            "filename": file.filename,
            "file_size_kb": round(len(content) / 1024, 2),
            "benchmark_results": results,
            "parallel_processing_enabled": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Benchmark failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Benchmark failed: {str(e)}")
