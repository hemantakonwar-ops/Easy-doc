import re
from typing import List


def tokenize_words(text: str) -> List[str]:
    """Simple word tokenization."""
    return re.findall(r'\b\w+\b', text.lower())


def tokenize_sentences(text: str) -> List[str]:
    """Sentence tokenization."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if s.strip()]
