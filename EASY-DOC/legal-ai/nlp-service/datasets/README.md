# Legal AI Datasets

Place your training documents in the `raw/` subdirectory. The training pipeline will automatically discover, parse, chunk, embed, and store them in ChromaDB.

## Supported File Types

| Extension | Parser |
|-----------|--------|
| `.pdf` | pdfplumber |
| `.txt` | Direct read |
| `.json` | Extracts `text`, `content`, `document`, or `body` field |
| `.docx` | python-docx |

## Directory Structure

```
datasets/
├── README.md           # This file
├── .gitignore          # Ignore processed files & logs
├── raw/                # Drop your files here
│   ├── contracts/      # Contract documents
│   ├── legal_docs/     # General legal documents
│   └── case_law/       # Case law documents
├── processed.json      # Auto-generated: tracks processed files
└── training.log        # Auto-generated: training run logs
```

## Usage

```bash
cd nlp-service
python train.py
```

The pipeline is **idempotent** — files already processed (tracked by MD5 hash) will be skipped on subsequent runs.

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `CHUNK_SIZE` | 512 | Tokens per chunk |
| `CHUNK_OVERLAP` | 50 | Overlapping tokens between chunks |
| `VECTOR_DB_PATH` | `./chroma_db` | ChromaDB persistence directory |
