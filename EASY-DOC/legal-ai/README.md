# Legal AI System

## Overview

Full-stack **Document Intelligence + RAG-based Legal AI Assistant**.
Processes legal documents, extracts structured data, detects risks, and enables contextual Q&A.

Architecture is split into:

* Frontend (Next.js)
* Backend Gateway (Node.js)
* AI Microservice (FastAPI)

---

## System Architecture

```
Frontend (Next.js)
        ↓
Backend API (Node.js / Express)
        ↓
AI Service (FastAPI)
        ↓
Parsing + NLP + RAG + LLM
        ↓
MongoDB + FAISS
```

---

## Core Features

### 1. Document Upload & Parsing

* Supports PDF (digital + scanned)
* OCR pipeline for scanned docs
* Outputs structured JSON

### 2. Clause Extraction

* Identifies:

  * Liability
  * Termination
  * Payment
  * Confidentiality

### 3. Legal Simplification

* Converts complex legal text into plain language

### 4. Risk Detection

* Flags:

  * Unlimited liability
  * Penalties
  * Ambiguities

### 5. Risk Scoring

* Score (0–100)
* Based on severity + frequency

### 6. RAG Chat System

* Ask questions on document
* Context-aware responses
* Reduced hallucination

---

## Tech Stack

### Frontend

* Next.js
* React
* Tailwind CSS
* React Query
* Zustand

### Backend (Gateway)

* Node.js
* Express.js
* MongoDB
* Multer (file upload)

### AI Service

* FastAPI
* Uvicorn
* Pydantic

### Parsing

* pdfplumber
* pdf2image
* pytesseract
* opencv-python
* docling

### NLP

* spaCy
* scikit-learn
* NumPy

### RAG

* sentence-transformers
* FAISS

### LLM

* Gemini API
* OpenAI API (optional)
* Groq API (optional)

---

## Project Structure

```
legal-ai/
├── client/         # Next.js frontend
├── server/         # Node.js backend
├── nlp-service/    # FastAPI AI service
└── shared/         # optional shared configs
```

---

## Workflow

### Upload Flow

```
Upload → Node.js → FastAPI /parse
→ Parsing → Structured JSON → MongoDB
→ Embeddings → FAISS
```

### Chat Flow

```
Query → Embed → Vector Search → Context
→ LLM → Response
```

### Risk Flow

```
Clauses → Rules + ML + LLM → Score + Flags
```

---

## API Routes

### Node.js

```
POST   /api/upload
GET    /api/document/:id
POST   /api/chat
POST   /api/simplify
GET    /api/risk/:id
```

### FastAPI

```
POST   /parse
POST   /embed
POST   /search
POST   /chat
POST   /risk
POST   /simplify
```

---

## Environment Variables

### Root (.env reference)

```
MONGODB_URI=
JWT_SECRET=
FASTAPI_URL=http://localhost:8000
NODE_API_URL=http://localhost:5000
```

---

### client/.env.local

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

### server/.env

```
PORT=5000
MONGODB_URI=
JWT_SECRET=
FASTAPI_URL=http://localhost:8000
```

---

### nlp-service/.env

```
GEMINI_API_KEY=
OPENAI_API_KEY=
GROQ_API_KEY=
MONGODB_URI=
```

---

## Installation

### 1. Clone Repo

```
git clone <repo>
cd legal-ai
```

---

### 2. Setup Frontend

```
cd client
npm install
npm run dev
```

---

### 3. Setup Backend

```
cd server
npm install
npm run dev
```

---

### 4. Setup AI Service

```
cd nlp-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## System Dependencies

Install manually:

* Tesseract OCR
* Poppler

---

## Data Flow Summary

```
Document → Parse → Structure → Chunk → Embed
→ Store → Query → Retrieve → LLM → Output
```

---

## Design Principles

* Separation of concerns
* RAG-based grounding
* Hybrid NLP + LLM
* Microservice architecture
* Scalable and modular

---

## Output Example

```json
{
  "sections": [
    {
      "title": "Liability",
      "clauses": [
        {
          "text": "...",
          "category": "liability",
          "risk_flag": true
        }
      ]
    }
  ],
  "risk_score": 78
}
```

---

## Notes

* No LLM calls in Node.js (handled by FastAPI)
* No parsing outside AI service
* All embeddings stored in FAISS
* MongoDB stores metadata and documents

---

## Final Classification

* Document Intelligence System
* RAG-based Legal AI
* Hybrid NLP + LLM Pipeline

---