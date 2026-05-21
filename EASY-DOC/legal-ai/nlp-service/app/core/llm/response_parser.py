import json
import re
from typing import Dict, Any


def parse_json_response(text: str) -> Dict[str, Any]:
    """Extract JSON from LLM response."""
    try:
        # Try direct JSON parse
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to extract JSON from markdown code blocks
        match = re.search(r'```json\n(.*?)\n```', text, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        raise ValueError("Could not parse JSON from response")


def clean_response(text: str) -> str:
    """Clean up LLM response text."""
    # Remove markdown code blocks
    text = re.sub(r'```\w*\n?', '', text)
    return text.strip()
