import re
from typing import List


def segment_sentences(text: str) -> List[str]:
    """Split text into sentences."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if s.strip()]


def segment_paragraphs(text: str) -> List[str]:
    """Split text into paragraphs."""
    paragraphs = text.split('\n\n')
    return [p.strip() for p in paragraphs if p.strip()]
