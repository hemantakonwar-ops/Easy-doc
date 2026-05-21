import re
import unicodedata


def clean_text(text: str) -> str:
    """
    Clean and normalize text while preserving legal document structure.
    """
    if not text:
        return ""
    
    # Normalize Unicode
    text = unicodedata.normalize('NFKC', text)
    
    # Fix line breaks
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    # Remove control characters except newlines
    text = ''.join(char for char in text if unicodedata.category(char)[0] != 'C' or char == '\n')
    
    # Normalize whitespace (preserve paragraph structure)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)  # Max 2 consecutive newlines
    
    # Fix common OCR errors in legal documents
    ocr_fixes = {
        '|': 'I',  # Pipe to capital I
        '0': 'O',  # Zero to capital O (context dependent)
        '@': 'a',  # At to lowercase a
        '$': 'S',  # Dollar to capital S
        '1': 'l',  # One to lowercase L (context dependent)
    }
    
    # Apply OCR fixes selectively (only for isolated characters)
    for wrong, right in ocr_fixes.items():
        text = re.sub(rf'(?<![A-Za-z]){re.escape(wrong)}(?![A-Za-z])', right, text)
    
    # Remove empty lines but preserve structure
    lines = []
    for line in text.split('\n'):
        stripped = line.strip()
        if stripped:
            lines.append(stripped)
    
    return '\n'.join(lines)


def enhance_legal_text(text: str) -> str:
    """
    Enhanced cleaning specifically for legal documents.
    Preserves legal formatting and structure.
    """
    if not text:
        return ""
    
    # Basic cleaning
    text = clean_text(text)
    
    # Preserve section headers (ALL CAPS lines)
    lines = text.split('\n')
    enhanced_lines = []
    
    for line in lines:
        # Detect and preserve section headers
        if re.match(r'^[A-Z][A-Z\s\d\.]+$', line) and len(line) > 3:
            enhanced_lines.append(f"\n{line}\n")
        # Detect article/clause numbers
        elif re.match(r'^(Article|Section|Clause|\d+[\.\)])\s+', line, re.IGNORECASE):
            enhanced_lines.append(f"\n{line}")
        else:
            enhanced_lines.append(line)
    
    text = '\n'.join(enhanced_lines)
    
    # Normalize legal citations (e.g., "Section 1.2" to consistent format)
    text = re.sub(r'(?i)section\s+(\d+[\.\d]*)', r'Section \1', text)
    text = re.sub(r'(?i)article\s+(\d+[\.\d]*)', r'Article \1', text)
    text = re.sub(r'(?i)clause\s+(\d+[\.\d]*)', r'Clause \1', text)
    
    # Clean up excessive whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()


def normalize_whitespace(text: str) -> str:
    """Normalize whitespace while preserving paragraph breaks."""
    # Replace multiple spaces with single space
    text = re.sub(r' +', ' ', text)
    # Normalize tabs to spaces
    text = re.sub(r'\t+', ' ', text)
    return text.strip()
