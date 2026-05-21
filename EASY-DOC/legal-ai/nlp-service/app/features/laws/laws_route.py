import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.core.llm.provider import get_llm_response
from app.core.llm.prompt_builder import PromptBuilder
import json
from datetime import datetime, timezone
from app.features.laws.insightlaw_service import get_insightlaw_service

logger = logging.getLogger(__name__)
router = APIRouter()

class AnalyzeLawsRequest(BaseModel):
    document_id: str
    text: str
    jurisdiction: Optional[str] = None

class LawReference(BaseModel):
    law_name: str
    section: Optional[str] = None
    article: Optional[str] = None
    context: str
    link: str
    importance: str 
    category: str    
    relevance_score: Optional[float] = None 
class AnalyzeLawsResponse(BaseModel):
    success: bool
    document_id: str
    laws: List[LawReference]
    generated_at: str
    cached: bool
    source: str 

@router.post("/analyze", response_model=AnalyzeLawsResponse)
async def analyze_laws(request: AnalyzeLawsRequest):
    """Analyze a legal document and extract relevant laws and statutes using InsightLaw API."""
    logger.info(f"Starting law analysis for document: {request.document_id}")
    
    if not request.text or len(request.text.strip()) == 0:
        logger.warning(f"Empty text provided for document: {request.document_id}")
        return AnalyzeLawsResponse(
            success=True,
            document_id=request.document_id,
            laws=[],
            generated_at=datetime.now(timezone.utc).isoformat(),
            cached=False,
            source="no_text"
        )
    
    try:
        # Truncate text to avoid token limits
        text_excerpt = request.text[:8000] if len(request.text) > 8000 else request.text
        
        extract_prompt = f"""Extract a JSON list of the top 5 most important legal entities (acts, statutes, sections, cases) EXPLICITLY mentioned in this text.
        CRITICAL: ONLY extract entities that are directly written in the text. Do NOT guess or infer applicable laws.
        If NO laws or legal entities are explicitly mentioned, output an empty JSON array: []
        Output ONLY a valid JSON array of strings. Example: ["Section 138 Negotiable Instruments Act", "NDPS Act", "Kesavananda Bharati case"]
        Text (excerpt):
        {text_excerpt}
        """
        
        logger.info(f"Calling LLM for entity extraction, text length: {len(text_excerpt)}")
        response_text = await get_llm_response(extract_prompt, temperature=0.1)
        logger.info(f"LLM response received: {response_text[:200]}...")
        
        entities = []
        try:
            import re
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                entities = json.loads(json_match.group(0))
            else:
                entities = json.loads(response_text)
            
            logger.info(f"Successfully extracted {len(entities)} entities: {entities}")
        except Exception as e:
            logger.warning(f"Failed to parse entities JSON: {e}. Response was: {response_text[:500]}")
            
        # Step 2: Query InsightLaw API with extracted entities
        insightlaw_service = get_insightlaw_service()
        laws_data = []
        source = "insightlaw_api"
        
        if entities and len(entities) > 0:
            logger.info(f"Querying InsightLaw API with {len(entities)} entities")
            try:
                api_results = await insightlaw_service.fetch_laws(entities, request.jurisdiction)
                logger.info(f"InsightLaw API returned {len(api_results)} results")
                
                for res in api_results:
                    laws_data.append(LawReference(
                        law_name=res.get("law_name", ""),
                        section=res.get("section"),
                        article=res.get("article"),
                        context=res.get("summary", f"Legal reference to {res.get('law_name', 'this statute')}."),
                        link=res.get("link", ""),
                        importance=res.get("importance", "medium"),
                        category=res.get("category", "statute"),
                        relevance_score=res.get("relevance_score", 0.9)
                    ))
            except Exception as api_error:
                logger.error(f"InsightLaw API failed: {api_error}")
                # Continue to LLM fallback
                
        # Step 3: Fallback to detailed LLM analysis if API returns empty or failed
        if not laws_data:
            logger.info("No results from InsightLaw API, using LLM fallback")
            source = "llm_fallback"
            
            try:
                prompt = f"""You are a legal document analysis AI. Extract all legal references mentioned in the provided document text.
                
                Identify:
                1. Laws, acts, or statutes EXPLICITLY named.
                2. Relevant legal frameworks or regulations that are HIGHLY APPLICABLE to the content (e.g., if it's an employment contract in India, mention 'Indian Contract Act' and 'Industrial Disputes Act').
                
                If NO laws are mentioned and none can be reliably inferred, return an empty JSON array: []
                
                Output Format - JSON Array with this exact structure:
                [{{ "law_name": "Name of Act/Statute", "section": "Section number if applicable", "article": "Article number if applicable", "context": "Explain WHY this law applies to this specific document in 1-2 sentences", "link": "", "importance": "high|medium|low", "category": "statute|regulation|case_law|constitutional" }}]
                
                Constraints: 
                - Only output valid raw JSON array
                - Keep to 5 most relevant laws maximum
                - Focus on accurate and helpful legal context
                
                Document Text (excerpt):
                {text_excerpt}
                """
                
                llm_response = await get_llm_response(prompt, temperature=0.3)
                logger.info(f"LLM fallback response: {llm_response[:200]}...")
                
                try:
                    json_match = re.search(r'\[.*\]', llm_response, re.DOTALL)
                    fallback_data = json.loads(json_match.group(0)) if json_match else json.loads(llm_response)
                    
                    if isinstance(fallback_data, list):
                        for law in fallback_data:
                            laws_data.append(LawReference(
                                law_name=law.get("law_name", "Unknown"),
                                section=law.get("section"),
                                article=law.get("article"),
                                context=law.get("context", "Legal reference extracted from document."),
                                link=law.get("link", ""),
                                importance=law.get("importance", "medium"),
                                category=law.get("category", "statute"),
                                relevance_score=law.get("relevance_score", 0.85)
                            ))
                        logger.info(f"LLM fallback extracted {len(laws_data)} laws")
                    else:
                        logger.warning(f"LLM response was not an array: {fallback_data}")
                except Exception as parse_e:
                    logger.error(f"Fallback JSON parsing failed: {parse_e}")
                    laws_data = []
            except Exception as llm_error:
                logger.error(f"LLM fallback failed: {llm_error}")
                laws_data = []

        logger.info(f"Law analysis complete. Source: {source}, Laws found: {len(laws_data)}")
        
        return AnalyzeLawsResponse(
            success=True,
            document_id=request.document_id,
            laws=laws_data,
            generated_at=datetime.now(timezone.utc).isoformat(),
            cached=False,
            source=source
        )

    except Exception as e:
        logger.error(f"Law analysis failed: {str(e)}", exc_info=True)
        # Return empty response instead of 500 error for better UX
        return AnalyzeLawsResponse(
            success=False,
            document_id=request.document_id,
            laws=[],
            generated_at=datetime.now(timezone.utc).isoformat(),
            cached=False,
            source="error"
        )
