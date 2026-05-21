import os
import json
import logging
from pathlib import Path
from typing import List, Dict
import asyncio
from tqdm import tqdm

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('datasets/training.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Supported file types
SUPPORTED_EXTENSIONS = {'.pdf', '.txt', '.json', '.docx'}

class DatasetTrainer:
    def __init__(self, dataset_path: str = "datasets/raw"):
        self.dataset_path = Path(dataset_path)
        self.processed_log = Path("datasets/processed.json")
        self.stats = {
            "total_files": 0,
            "processed": 0,
            "failed": 0,
            "skipped": 0,
            "chunks_created": 0
        }
        
    def load_processed_hashes(self) -> set:
        """Load already processed file hashes for idempotency."""
        if self.processed_log.exists():
            with open(self.processed_log) as f:
                data = json.load(f)
                return set(data.get("hashes", []))
        return set()
    
    def save_processed_hash(self, file_hash: str):
        """Save processed file hash."""
        hashes = self.load_processed_hashes()
        hashes.add(file_hash)
        with open(self.processed_log, 'w') as f:
            json.dump({"hashes": list(hashes)}, f)
    
    def discover_files(self) -> List[Path]:
        """Discover all supported files in dataset folder."""
        files = []
        for ext in SUPPORTED_EXTENSIONS:
            files.extend(self.dataset_path.rglob(f"*{ext}"))
        return files
    
    async def parse_file(self, file_path: Path) -> str:
        """Parse file based on extension."""
        ext = file_path.suffix.lower()
        
        if ext == '.pdf':
            return await self._parse_pdf(file_path)
        elif ext == '.txt':
            return await self._parse_txt(file_path)
        elif ext == '.json':
            return await self._parse_json(file_path)
        elif ext == '.docx':
            return await self._parse_docx(file_path)
        else:
            raise ValueError(f"Unsupported file type: {ext}")
    
    async def _parse_pdf(self, path: Path) -> str:
        """Parse PDF using pdfplumber."""
        import pdfplumber
        text = ""
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text
    
    async def _parse_txt(self, path: Path) -> str:
        """Parse plain text file."""
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    
    async def _parse_json(self, path: Path) -> str:
        """Parse JSON and extract text field."""
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Try common text fields
            for field in ['text', 'content', 'document', 'body']:
                if field in data:
                    return data[field]
            return json.dumps(data)
    
    async def _parse_docx(self, path: Path) -> str:
        """Parse DOCX file."""
        from docx import Document
        doc = Document(path)
        return "\n".join([para.text for para in doc.paragraphs])
    
    def chunk_text(self, text: str, chunk_size: int = 512, overlap: int = 50) -> List[str]:
        """Split text into overlapping chunks."""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = words[i:i + chunk_size]
            chunks.append(" ".join(chunk))
            
            if i + chunk_size >= len(words):
                break
        
        return chunks
    
    async def generate_embeddings(self, chunks: List[str]) -> List[List[float]]:
        """Generate embeddings for chunks."""
        from app.core.embeddings import get_embedding_service
        svc = get_embedding_service()
        return await svc.encode(chunks)
    
    async def store_in_chroma(self, chunks: List[str], embeddings: List[List[float]], 
                               source: str, metadata: Dict):
        """Store embeddings in ChromaDB."""
        from app.core.vector_db import get_vector_db
        db = get_vector_db()
        
        ids = [f"{source}_{i}" for i in range(len(chunks))]
        metadatas = [{"source": source, **metadata, "chunk_index": i} 
                    for i in range(len(chunks))]
        
        db.add_documents(
            documents=chunks,
            embeddings=embeddings,
            ids=ids,
            metadatas=metadatas
        )
    
    async def process_file(self, file_path: Path, processed_hashes: set):
        """Process a single file through the pipeline."""
        import hashlib
        
        # Calculate hash for idempotency
        with open(file_path, 'rb') as f:
            file_hash = hashlib.md5(f.read()).hexdigest()
        
        if file_hash in processed_hashes:
            logger.info(f"Skipping {file_path} (already processed)")
            self.stats["skipped"] += 1
            return
        
        try:
            logger.info(f"Processing {file_path}")
            
            # Step 1: Parse
            text = await self.parse_file(file_path)
            if not text.strip():
                logger.warning(f"No text extracted from {file_path}")
                self.stats["failed"] += 1
                return
            
            # Step 2: Clean
            text = self.clean_text(text)
            
            # Step 3: Chunk
            chunks = self.chunk_text(text)
            self.stats["chunks_created"] += len(chunks)
            
            # Step 4: Embed
            embeddings = await self.generate_embeddings(chunks)
            
            # Step 5: Store
            await self.store_in_chroma(
                chunks, embeddings, 
                source=str(file_path.name),
                metadata={
                    "filename": file_path.name,
                    "type": file_path.suffix,
                    "size": os.path.getsize(file_path)
                }
            )
            
            # Mark as processed
            self.save_processed_hash(file_hash)
            self.stats["processed"] += 1
            logger.info(f"✓ Successfully processed {file_path} ({len(chunks)} chunks)")
            
        except Exception as e:
            logger.error(f"✗ Failed to process {file_path}: {str(e)}")
            self.stats["failed"] += 1
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        import re
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep legal symbols
        text = re.sub(r'[^\w\s.,;:!?()\-\'/"§]', '', text)
        
        return text.strip()
    
    async def train(self):
        """Main training pipeline."""
        logger.info("=" * 60)
        logger.info("Starting Dataset Training Pipeline")
        logger.info("=" * 60)
        
        # Discover files
        files = self.discover_files()
        self.stats["total_files"] = len(files)
        logger.info(f"Found {len(files)} files to process")
        
        if not files:
            logger.warning("No files found in datasets/raw/")
            return
        
        # Load processed hashes for idempotency
        processed_hashes = self.load_processed_hashes()
        logger.info(f"Found {len(processed_hashes)} already processed files")
        
        # Process files
        for file_path in tqdm(files, desc="Processing files"):
            await self.process_file(file_path, processed_hashes)
        
        # Print summary
        logger.info("=" * 60)
        logger.info("Training Complete")
        logger.info("=" * 60)
        logger.info(f"Total files: {self.stats['total_files']}")
        logger.info(f"Processed: {self.stats['processed']}")
        logger.info(f"Failed: {self.stats['failed']}")
        logger.info(f"Skipped (duplicates): {self.stats['skipped']}")
        logger.info(f"Total chunks created: {self.stats['chunks_created']}")

async def main():
    trainer = DatasetTrainer()
    await trainer.train()

if __name__ == "__main__":
    asyncio.run(main())
