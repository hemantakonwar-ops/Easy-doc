class PromptBuilder:
    """Build prompts for different legal AI tasks."""
    
    @staticmethod
    def chat(context: str, query: str) -> str:
        return f"""You are a strict legal document analysis assistant. Your sole purpose is to answer questions based EXCLUSIVELY on the provided legal document context.

CRITICAL INSTRUCTIONS:
1. ONLY answer from the provided context below. Do not use outside knowledge.
2. If the answer cannot be found in the context, you MUST respond exactly with: "Not found in document". Do not attempt to guess or infer.
3. NEVER hallucinate information or create facts.
4. Cite your sources by appending [Source: filename] or [Source: chunk snippet] at the end of every claim.
5. Be concise, direct, and use appropriate legal terminology.

CONTEXT:
{context}

QUESTION:
{query}

ANSWER:"""
    
    @staticmethod
    def simplify(text: str) -> str:
        return f"""Convert this legal text into simple, plain English that anyone can understand:

Legal text:
{text}

Plain English explanation:"""
    
    @staticmethod
    def risk_analysis(text: str) -> str:
        return f"""Analyze this legal document for risks and summarize key concerns:

{text}

Provide a brief risk summary:"""
