# Real-World Legal API Integration Guide

## Available Legal APIs for Indian Law

### 1. Indian Kanoon API (RECOMMENDED)
**Website:** https://api.indiankanoon.org/
**Pricing:** Free tier available, paid plans for higher usage
**Authentication:** API Token or Public-Private Key

**API Endpoints:**
- `POST /search/` - Search for documents
- `POST /doc/` - Fetch document by ID
- `POST /docfragment/` - Fetch document fragment
- `POST /docmeta/` - Fetch document metadata

**How to get API Key:**
1. Visit https://api.indiankanoon.org/
2. Sign up for an account
3. Generate API token from dashboard
4. Add token to request header: `Authorization: Token <your_token>`

### 2. KanoonGPT API
**Website:** https://kanoongpt.in/
**Features:** Section-wise legal data, simplified explanations
**Pricing:** Paid API with tiered plans

### 3. Government Open Data API
**Website:** https://www.data.gov.in/
**Features:** Access to legislative data, acts, rules
**Pricing:** Free

### 4. Alternative: Web Scraping (Not Recommended)
- Indian Kanoon website allows limited scraping
- Respect robots.txt and rate limits
- Legal gray area

---

## Implementation Steps

### Step 1: Sign Up for Indian Kanoon API

```bash
# 1. Visit https://api.indiankanoon.org/
# 2. Click "Sign Up"
# 3. Verify email
# 4. Go to Dashboard > API Tokens
# 5. Generate new token
# 6. Copy the token (looks like: 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b)
```

### Step 2: Add API Key to Environment Variables

**Create `nlp-service/.env`:**
```bash
# Indian Kanoon API
INDIAN_KANOON_API_KEY=your_api_token_here
INDIAN_KANOON_BASE_URL=https://api.indiankanoon.org

# Fallback: Use mock data if API fails
USE_MOCK_DATA_ON_FAILURE=true
```

### Step 3: Update Configuration

**Update `nlp-service/app/core/config.py`:**
```python
import os

class Settings:
    # ... existing config ...
    
    # Indian Kanoon API
    indiankanoon_api_key: str = os.getenv("INDIAN_KANOON_API_KEY", "")
    indiankanoon_base_url: str = os.getenv("INDIAN_KANOON_BASE_URL", "https://api.indiankanoon.org")
    use_mock_on_failure: bool = os.getenv("USE_MOCK_DATA_ON_FAILURE", "true").lower() == "true"

settings = Settings()
```

### Step 4: Implement Real API Service

See the updated `insightlaw_service.py` below for full implementation.

---

## API Usage Examples

### Search for Legal Documents
```python
import httpx

async def search_kanoon(query: str, api_key: str):
    url = "https://api.indiankanoon.org/search/"
    headers = {
        "Authorization": f"Token {api_key}",
        "Accept": "application/json"
    }
    data = {
        "formInput": query,
        "pagenum": 0,
        "maxpages": 5
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, data=data)
        return response.json()

# Example usage
results = await search_kanoon("Indian Contract Act Section 10", api_key)
```

### Fetch Specific Document
```python
async def fetch_document(doc_id: str, api_key: str):
    url = "https://api.indiankanoon.org/doc/"
    headers = {
        "Authorization": f"Token {api_key}",
        "Accept": "application/json"
    }
    data = {"document_id": doc_id}
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, data=data)
        return response.json()
```

---

## Rate Limits & Pricing

### Indian Kanoon API Limits:
- **Free Tier:** 100 requests/day
- **Basic Plan:** 1000 requests/day ($50/month)
- **Pro Plan:** 10,000 requests/day ($200/month)
- **Enterprise:** Custom pricing

### Best Practices:
1. Implement caching (done ✅)
2. Batch requests when possible
3. Use fallback mock data on API failure
4. Monitor rate limit headers
5. Implement retry with exponential backoff

---

## Testing the Integration

### Test with curl:
```bash
curl -X POST https://api.indiankanoon.org/search/ \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Accept: application/json" \
  -d "formInput=Indian Contract Act" \
  -d "pagenum=0"
```

### Test from Python:
```python
import asyncio
from app.features.laws.insightlaw_service import get_insightlaw_service

async def test():
    service = get_insightlaw_service()
    results = await service.fetch_laws(["Indian Contract Act"], "India")
    print(results)

asyncio.run(test())
```

---

## Troubleshooting

### Common Issues:

**1. 403 Forbidden Error**
- Check API token is correct
- Ensure token is active in dashboard
- Verify token in header format: `Token <token>`

**2. Rate Limit Exceeded (429)**
- Implement caching (already done)
- Add delays between requests
- Upgrade plan if needed

**3. Empty Results**
- Check query spelling
- Try broader search terms
- Use fallback mock data

**4. Timeout Errors**
- API may be slow during peak hours
- Implement timeout handling
- Use mock data as fallback

---

## Updated Implementation

The `insightlaw_service.py` has been updated with:
- ✅ Real API integration ready
- ✅ Fallback to mock data
- ✅ Better error handling
- ✅ Comprehensive Indian law database
- ✅ Smart entity matching

**To activate real API:**
1. Get API key from https://api.indiankanoon.org/
2. Add to `.env` file
3. Restart Python service
4. Test with a legal document

**The service will automatically:**
- Try real API first
- Fall back to mock data on failure
- Cache results for 1 hour
- Log all API interactions
