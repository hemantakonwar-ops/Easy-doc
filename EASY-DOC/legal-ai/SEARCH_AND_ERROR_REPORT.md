# Legal AI Error And `/search` Improvement Report

Generated: 2026-04-29

## Verification Summary

- `python -m compileall app` in `nlp-service` passed.
- `node --check app.js` in `server` passed.
- `npm.cmd run build` in `client` failed during TypeScript validation.
- `npm.cmd run lint` in `client` is not configured yet; Next.js opened the interactive ESLint setup prompt.

## Confirmed Errors

### 1. Client production build fails on upload response typing

File: `client/app/upload/page.tsx:88`

The build fails with:

```text
Type error: Property 'documentId' does not exist on type 'AxiosResponse<any, any, {}>'.
```

Cause:

- `client/lib/axiosInstance.ts` returns `response.data` in an interceptor.
- TypeScript still sees `api.post(...)` as returning `AxiosResponse`.
- `client/features/upload/uploadService.ts` returns the raw `api.post` result without a response interface or cast.
- `UploadPage` expects `result.documentId`.

Recommended fix:

- Create an `UploadResponse` interface in `client/features/upload/uploadService.ts`.
- Cast or generic-type the returned payload consistently, as other services already do.
- Longer term, wrap Axios in typed helper functions so `api.get/post` are typed as data-returning calls.

### 2. ESLint is not configured

Command:

```text
npm.cmd run lint
```

Result:

Next.js asks how to configure ESLint interactively. This means CI or non-interactive validation cannot rely on `npm run lint` yet.

Recommended fix:

- Add a committed ESLint config, for example `.eslintrc.json`.
- Re-run lint and fix reported issues.

### 3. Root `dev:all` script is Unix-style and likely fails on Windows PowerShell

File: `package.json:15`

Current script:

```json
"dev:all": "npm run dev:nlp & npm run dev:server & npm run dev:client & wait"
```

Problems:

- `wait` is a Unix shell builtin, not a PowerShell command.
- The repo already depends on `concurrently`, but does not use it here.

Recommended fix:

```json
"dev:all": "concurrently \"npm run dev:nlp\" \"npm run dev:server\" \"npm run dev:client\""
```

### 4. PowerShell may block plain `npm` commands

Observed:

```text
npm.ps1 cannot be loaded because running scripts is disabled on this system.
```

Workaround:

- Use `npm.cmd run ...` in PowerShell.

Recommended fix:

- Document this in `README.md`, or use a terminal profile that invokes `npm.cmd`.

## `/search` Route Issues

### 1. Search is authenticated but not user-scoped

Files:

- `server/features/search/search.route.js`
- `server/features/search/search.controller.js`
- `nlp-service/app/features/search/search_service.py`

The Node route requires a token, but the actual search only sends `query` and optional `documentId`. There is no `userId`, organization, ownership check, or document permission filter.

Impact:

- Any authenticated user can potentially search all FAISS chunks.
- If document IDs are known or leaked, users may query documents they do not own.

Recommended fix:

- Add owner fields to documents/uploads.
- In Node, validate `documentId` ownership before calling FastAPI.
- For global search, pass allowed document IDs to FastAPI and filter retrieval to those documents.

### 2. `top_k` exists in FastAPI but is not exposed by Node or client

Files:

- `nlp-service/app/features/search/search_route.py:11`
- `server/core/services/pythonClient.js:90`
- `client/features/search/searchService.ts:13`

FastAPI supports `top_k`, but the Node gateway always omits it. The UI cannot request more or fewer results.

Recommended fix:

- Add `topK` to client service.
- Validate it in Node, for example `1 <= topK <= 20`.
- Send `top_k` to FastAPI.

### 3. Search input validation is too weak

Files:

- `server/features/search/search.controller.js:5`
- `nlp-service/app/features/search/search_route.py:8`

Current validation only checks `if (!query)` in Node. FastAPI accepts any string size and unrestricted `top_k`.

Recommended fix:

- Trim query before use.
- Reject empty/whitespace-only queries.
- Set min/max query length.
- Use Pydantic constraints, for example `min_length`, `max_length`, and bounded `top_k`.

### 4. FAISS index is not loaded on FastAPI startup

Files:

- `nlp-service/app/db/faiss_store.py:132`
- `nlp-service/app/main.py:16`

`load_index()` exists but is not called in the FastAPI lifespan. After a service restart, `_get_index()` creates an empty index unless some other code calls `load_index()`.

Impact:

- Previously uploaded documents may become unsearchable after restarting the NLP service.

Recommended fix:

- Import and call `load_index()` during FastAPI startup before accepting search requests.

### 5. Document-filtered search can miss valid results

File: `nlp-service/app/db/faiss_store.py:106`

Current logic searches only `k * 3` global neighbors, then filters by `document_id`.

Impact:

- If the target document has relevant chunks outside the first `k * 3` global matches, the user gets too few or zero results.

Recommended fix:

- Maintain a per-document FAISS index or metadata index of vector IDs.
- Or over-fetch much more aggressively with a cap, then filter.
- Better: use a vector store that supports metadata filters natively.

### 6. Result enrichment performs one Mongo query per chunk

File: `nlp-service/app/features/search/search_service.py:23`

For every result, FastAPI calls:

```python
await db.documents.find_one({"documentId": doc_id})
```

Impact:

- Repeated chunks from the same document trigger duplicate DB calls.
- Higher `top_k` will increase latency unnecessarily.

Recommended fix:

- Collect unique `doc_id` values.
- Query Mongo once with `$in`.
- Build a `documentId -> document` map.

### 7. Search response shape is under-typed

Files:

- `nlp-service/app/features/search/search_route.py:14`
- `client/features/search/searchService.ts:3`

FastAPI uses `results: list`, and the client only types `text` and `score`, even though the page depends on `documentId`, `filename`, and `snippet`.

Recommended fix:

- Add a Pydantic `SearchResult` model with fields:
  - `text`
  - `score`
  - `documentId`
  - `filename`
  - `snippet`
  - optional `chunkIndex`, `page`, `sectionTitle`
- Mirror that type in TypeScript.

### 8. UI filter buttons do not do anything

File: `client/app/search/page.tsx:130`

The UI shows `All Documents`, `High Risk`, and `Recent`, but no state or API parameter is connected.

Recommended fix:

- Either remove inactive filters for now, or implement real filter state.
- Useful filters: document, risk band, date range, document type, clause type.

### 9. Quick-search chips search the previous query

File: `client/app/search/page.tsx:218`

Current code:

```tsx
setQuery(term);
handleSearch();
```

React state updates are async, so `handleSearch()` still sees the old `query` value.

Recommended fix:

- Change `handleSearch` to accept an optional query override.
- Call `handleSearch(undefined, term)` or create a separate `runSearch(term)` function.

### 10. Empty `documentId` can create broken result links

File: `client/app/search/page.tsx:54`

The client falls back to `documentId: ''`, then renders:

```tsx
href={`/history/${result.documentId}`}
```

Impact:

- Bad backend data can produce `/history/` links.

Recommended fix:

- Filter out results without `documentId`, or render them as disabled/error states.

## Recommended `/search` Upgrade Plan

### Priority 1: Correctness and safety

1. Load FAISS index during FastAPI startup.
2. Add ownership checks in Node before search.
3. Restrict global search to documents owned by the current user.
4. Add strong validation for `query`, `documentId`, and `topK`.
5. Fix quick-search chips so they search the clicked term.

### Priority 2: Search quality

1. Add hybrid retrieval: semantic vector search plus keyword/BM25 search.
2. Add reranking after retrieval, especially for legal clauses.
3. Store chunk metadata: page number, section heading, clause type, chunk index, offsets.
4. Return highlighted snippets around the matched terms instead of the first 200 characters.
5. Add score normalization because FAISS inner-product scores are not true percentages.

### Priority 3: Performance

1. Batch Mongo enrichment using `$in`.
2. Cache repeated query embeddings for short periods.
3. Add per-document or metadata-filterable vector indexes.
4. Avoid holding the global FAISS lock for longer than needed.
5. Add pagination or cursoring if `topK` grows.

### Priority 4: Product experience

1. Make filters real: risk, date, document, clause type.
2. Add a document picker for scoped search.
3. Show filename, page/section, highlighted excerpt, and confidence label.
4. Add sorting by relevance, recency, risk, and document name.
5. Add “search within this document” entry points from document/history pages.

## Suggested API Shape

Client to Node:

```json
{
  "query": "termination for convenience",
  "documentId": "optional-document-id",
  "topK": 10,
  "filters": {
    "risk": ["high"],
    "dateFrom": "2026-01-01",
    "dateTo": "2026-04-29"
  }
}
```

Node to FastAPI:

```json
{
  "query": "termination for convenience",
  "document_id": "optional-document-id",
  "allowed_document_ids": ["doc-1", "doc-2"],
  "top_k": 10,
  "filters": {
    "risk": ["high"]
  }
}
```

Response:

```json
{
  "success": true,
  "query": "termination for convenience",
  "results": [
    {
      "documentId": "doc-1",
      "filename": "Agreement.pdf",
      "text": "full chunk text",
      "snippet": "highlighted contextual snippet",
      "score": 0.82,
      "page": 4,
      "sectionTitle": "Termination",
      "chunkIndex": 12
    }
  ]
}
```

## Test Coverage To Add

1. Node route rejects empty or whitespace query.
2. Node route rejects unauthorized document search.
3. Node route forwards `topK` and filters correctly.
4. FastAPI validates `top_k` bounds.
5. FastAPI returns persisted FAISS results after restart.
6. Document-scoped search returns results even when the document is not in the global top `k * 3`.
7. Client quick-search chips search the clicked term.
8. Client does not render links for malformed results without `documentId`.

