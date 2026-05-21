"""
InsightLaw API Integration - Real Legal Data Service
https://insightlaw.in - Free tier, no API key required

Features:
- Constitution of India (Articles)
- Indian Penal Code (IPC) Sections
- Bharatiya Nyaya Sanhita (BNS) 2023
- Kerala Acts
- Cross-corpus search
- AI-powered section explanations

Free tier: 200 requests/hour, 300 char previews
Pro tier: Full text, unlimited requests
"""

import logging
import httpx
import re
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import asyncio

logger = logging.getLogger(__name__)

_law_cache = {}
_cache_ttl = timedelta(hours=1)

INSIGHTLAW_BASE_URL = "https://insightlaw.in"

class InsightLawService:
    """
    Service to interact with InsightLaw API for Indian Legal Data.
    
    No API key required for free tier (200 req/hour).
    Supports: Constitution, IPC, BNS 2023, Kerala Acts
    """
    
    def __init__(self):
        self.base_url = INSIGHTLAW_BASE_URL
        self.request_count = 0
        self.hourly_limit = 200  
        
    def _is_rate_limited(self) -> bool:
        """Check if we're approaching rate limit."""
        return self.request_count >= self.hourly_limit
    
    def _cache_key(self, endpoint: str, params: dict) -> str:
        """Generate cache key for request."""
        param_str = "|".join([f"{k}={v}" for k, v in sorted(params.items())])
        return f"{endpoint}:{param_str}"
    
    def _get_cached(self, key: str) -> Optional[Dict]:
        """Get cached result if not expired."""
        if key in _law_cache:
            data, timestamp = _law_cache[key]
            if datetime.now() - timestamp < _cache_ttl:
                logger.info(f"Cache hit for {key}")
                return data
            else:
                del _law_cache[key]
        return None
    
    def _set_cached(self, key: str, data: Dict):
        """Cache result with timestamp."""
        _law_cache[key] = (data, datetime.now())
        
    async def _make_request(self, endpoint: str, params: dict = None) -> Dict:
        """Make HTTP request to InsightLaw API with caching."""
        url = f"{self.base_url}{endpoint}"
        cache_key = self._cache_key(endpoint, params or {})
        
        # Check cache
        cached = self._get_cached(cache_key)
        if cached:
            return cached
            
        if self._is_rate_limited():
            logger.warning("Rate limit approaching, using cached/mock data")
            return {}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    params=params,
                    timeout=10.0,
                    headers={
                        "Accept": "application/json",
                        "User-Agent": "LegalAI-Platform/1.0"
                    }
                )
                
                self.request_count += 1
                
                if response.status_code == 200:
                    data = response.json()
                    self._set_cached(cache_key, data)
                    return data
                elif response.status_code == 429:
                    logger.error("Rate limit exceeded (429)")
                    return {"error": "Rate limit exceeded", "rate_limited": True}
                else:
                    logger.error(f"InsightLaw API error: {response.status_code}")
                    return {}
                    
        except httpx.TimeoutException:
            logger.error(f"Timeout calling InsightLaw API: {url}")
            return {}
        except Exception as e:
            logger.error(f"InsightLaw API request failed: {e}")
            return {}
    
    # ==================== CONSTITUTION ====================
    
    async def get_constitution_article(self, number: int, lang: str = "en") -> Dict:
        """
        Get Constitution Article by number.
        
        GET /api/constitution/article/{number}?lang={lang}
        """
        endpoint = f"/api/constitution/article/{number}"
        return await self._make_request(endpoint, {"lang": lang})
    
    async def search_constitution(self, query: str, limit: int = 10, lang: str = "en,ml,hi") -> Dict:
        """
        Search Constitution of India.
        
        GET /api/constitution/search?q={query}&limit={limit}&lang={lang}
        """
        endpoint = "/api/constitution/search"
        return await self._make_request(endpoint, {
            "q": query,
            "limit": limit,
            "lang": lang
        })
    
    # ==================== IPC (Indian Penal Code) ====================
    
    async def get_ipc_section(self, number: str, lang: str = "en") -> Dict:
        """
        Get IPC Section by number.
        
        GET /api/ipc/section/{number}?lang={lang}
        """
        endpoint = f"/api/ipc/section/{number}"
        return await self._make_request(endpoint, {"lang": lang})
    
    async def search_ipc(self, query: str, limit: int = 10, lang: str = "en,ml,hi") -> Dict:
        """
        Search Indian Penal Code.
        
        GET /api/ipc/search?q={query}&limit={limit}&lang={lang}
        """
        endpoint = "/api/ipc/search"
        return await self._make_request(endpoint, {
            "q": query,
            "limit": limit,
            "lang": lang
        })
    
    # ==================== BNS 2023 (Bharatiya Nyaya Sanhita) ====================
    
    async def get_bns_section(self, number: str, lang: str = "en") -> Dict:
        """
        Get BNS Section by number.
        
        GET /api/bns/section/{number}?lang={lang}
        """
        endpoint = f"/api/bns/section/{number}"
        return await self._make_request(endpoint, {"lang": lang})
    
    async def search_bns(self, query: str, limit: int = 10, lang: str = "en,ml,hi") -> Dict:
        """
        Search Bharatiya Nyaya Sanhita 2023.
        
        GET /api/bns/search?q={query}&limit={limit}&lang={lang}
        """
        endpoint = "/api/bns/search"
        return await self._make_request(endpoint, {
            "q": query,
            "limit": limit,
            "lang": lang
        })
    
    # ==================== CROSS-CORPUS SEARCH ====================
    
    async def search_all(self, query: str, limit: int = 8) -> Dict:
        """
        Search across all corpora (Constitution, IPC, BNS).
        
        GET /api/search?q={query}&limit={limit}
        """
        endpoint = "/api/search"
        return await self._make_request(endpoint, {
            "q": query,
            "limit": limit
        })
    
    # ==================== AI EXPLANATION ====================
    
    async def explain_section(self, corpus: str, section: str) -> Dict:
        """
        Get AI explanation for a section.
        
        GET /api/explain/{corpus}/{section}
        
        corpus: "constitution", "ipc", "bns"
        """
        endpoint = f"/api/explain/{corpus}/{section}"
        return await self._make_request(endpoint)
    
    # ==================== SMART ENTITY RESOLUTION ====================
    
    async def fetch_laws(self, entities: List[str], jurisdiction: Optional[str] = "India") -> List[Dict]:
        """
        Main method to fetch laws for extracted entities with parallel resolution.
        """
        if not entities:
            return []
        
        logger.info(f"Fetching laws for {len(entities)} entities: {entities}")
        
        # Parallelize entity resolution for efficiency
        tasks = [self._resolve_entity(entity) for entity in entities[:5]]
        resolved_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        results = []
        for i, res in enumerate(resolved_results):
            if isinstance(res, Exception):
                logger.warning(f"Failed to resolve entity '{entities[i]}': {res}")
            elif res:
                results.append(res)
        
        logger.info(f"Resolved {len(results)} laws from {len(entities)} entities")
        return results
    
    async def _resolve_entity(self, entity: str) -> Optional[Dict]:
        """
        Resolve a legal entity to specific API call.
        
        Examples:
        - "Section 302 IPC" -> search_ipc
        - "Article 21" -> get_constitution_article
        - "BNS Section 103" -> get_bns_section
        """
        entity_lower = entity.lower()
        
        # Pattern matching for different legal references
        patterns = [
            # Constitution Articles
            (r'article\s+(\d+[A-Z]?)', 'constitution', self.get_constitution_article),
            # IPC Sections
            (r'section\s+(\d+[A-Z]?)\s+ipc', 'ipc', self.get_ipc_section),
            (r'ipc\s+section\s+(\d+[A-Z]?)', 'ipc', self.get_ipc_section),
            # BNS Sections
            (r'section\s+(\d+[A-Z]?)\s+bns', 'bns', self.get_bns_section),
            (r'bns\s+section\s+(\d+[A-Z]?)', 'bns', self.get_bns_section),
            (r'section\s+(\d+[A-Z]?)\s+bharatiya', 'bns', self.get_bns_section),
        ]
        
        for pattern, corpus, fetcher in patterns:
            match = re.search(pattern, entity_lower)
            if match:
                number = match.group(1)
                logger.info(f"Matched {corpus} section {number} from '{entity}'")
                
                try:
                    data = await fetcher(number)
                    return self._format_law_data(data, entity, corpus)
                except Exception as e:
                    logger.error(f"Failed to fetch {corpus} {number}: {e}")
                    return self._create_fallback_law(entity, corpus)
        
        # General search if no specific pattern matched
        logger.info(f"No specific pattern matched for '{entity}', using general search")
        search_results = await self.search_all(entity, limit=3)
        
        if search_results and "results" in search_results:
            for result in search_results["results"][:1]:  # Take first result
                return self._format_search_result(result, entity)
        
        # Fallback if API fails
        return self._create_fallback_law(entity, "statute")
    
    def _format_law_data(self, data: Dict, entity: str, corpus: str) -> Dict:
        """Format API response into standard law reference."""
        corpus_names = {
            "constitution": "Constitution of India",
            "ipc": "Indian Penal Code",
            "bns": "Bharatiya Nyaya Sanhita 2023"
        }
        
        return {
            "law_name": data.get("title", entity),
            "section": data.get("section_number") or data.get("metadata", {}).get("section_number"),
            "article": data.get("article_number") if corpus == "constitution" else None,
            "summary": data.get("preview", data.get("text", "")[:300]) or f"Legal reference to {entity}",
            "relevance_score": 0.95,
            "link": f"{self.base_url}/api/{corpus}/section/{data.get('section_number', '')}" if corpus != "constitution" else f"{self.base_url}/api/constitution/article/{data.get('article_number', '')}",
            "category": corpus,
            "importance": "high" if corpus in ["constitution", "ipc"] else "medium",
            "source": "insightlaw_api",
            "corpus": corpus_names.get(corpus, corpus)
        }
    
    def _format_search_result(self, result: Dict, entity: str) -> Dict:
        """Format search result into standard law reference."""
        return {
            "law_name": result.get("title", entity),
            "section": result.get("metadata", {}).get("section_number"),
            "article": result.get("metadata", {}).get("article_number"),
            "summary": result.get("preview", "")[:300],
            "relevance_score": 0.85,
            "link": f"{self.base_url}/api/{result.get('corpus', 'search')}/section/{result.get('metadata', {}).get('section_number', '')}",
            "category": result.get("corpus", "statute"),
            "importance": "medium",
            "source": "insightlaw_search",
            "corpus": result.get("corpus", "Unknown").upper()
        }
    
    def _create_fallback_law(self, entity: str, category: str) -> Dict:
        """Create fallback law reference when API fails."""
        corpus_names = {
            "constitution": "Constitution of India",
            "ipc": "Indian Penal Code",
            "bns": "Bharatiya Nyaya Sanhita 2023",
            "statute": "Indian Statute"
        }
        
        return {
            "law_name": entity.title(),
            "section": None,
            "article": None,
            "summary": f"Legal reference to {entity}. Full details available on InsightLaw.",
            "relevance_score": 0.75,
            "link": f"{self.base_url}/api/search?q={entity.replace(' ', '+')}",
            "category": category,
            "importance": "medium",
            "source": "insightlaw_fallback",
            "corpus": corpus_names.get(category, "Indian Law")
        }
    
    async def health_check(self) -> Dict:
        """Check if InsightLaw API is healthy."""
        endpoint = "/api/health"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}{endpoint}",
                    timeout=5.0
                )
                return {
                    "status": "healthy" if response.status_code == 200 else "unhealthy",
                    "status_code": response.status_code,
                    "requests_remaining": self.hourly_limit - self.request_count
                }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "requests_remaining": 0
            }

# Singleton instance
_insightlaw_service = None

def get_insightlaw_service() -> InsightLawService:
    """Get singleton instance of InsightLawService."""
    global _insightlaw_service
    if _insightlaw_service is None:
        _insightlaw_service = InsightLawService()
    return _insightlaw_service
