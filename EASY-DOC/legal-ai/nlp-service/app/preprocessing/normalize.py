import re
import unicodedata


def normalize_text(text: str) -> str:
    """Normalize Unicode and standardize whitespace."""
    # Normalize Unicode
    text = unicodedata.normalize('NFKC', text)
    # Standardize whitespace
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def normalize_quotes(text: str) -> str:
    """Normalize quotes to standard ASCII."""
    text = text.replace('"', '"').replace('"', '"')
    text = text.replace(''', "'").replace(''', "'")
    return text
