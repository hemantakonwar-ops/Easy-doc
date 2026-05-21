import re
from typing import List, Tuple


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """
    Chunk text with overlap for RAG processing.
    Tries to break at natural boundaries.
    """
    if not text:
        return []
    
    chunks = []
    start = 0
    text_len = len(text)
    
    while start < text_len:
        end = min(start + chunk_size, text_len)
        
        # Try to break at natural boundaries
        if end < text_len:
            end = _find_best_breakpoint(text, start, end, chunk_size)
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        
        # Move with overlap
        start = end - overlap if end < text_len else end
    
    return chunks


def _find_best_breakpoint(text: str, start: int, end: int, chunk_size: int) -> int:
    """Find the best breakpoint within a range."""
    search_start = start + int(chunk_size * 0.7)  # Look in last 30%
    search_end = min(end + 100, len(text))  # Allow slight overflow
    
    # Priority 1: Double newline (paragraph break)
    para_break = text.rfind('\n\n', search_start, search_end)
    if para_break > search_start:
        return para_break + 2
    
    # Priority 2: Section/Article boundary
    section_match = re.search(r'\n\n(?:Article|Section|Clause|\d+\.)\s+', text[start:search_end])
    if section_match:
        return start + section_match.start() + 2
    
    # Priority 3: Sentence boundary
    for i in range(min(search_end, len(text) - 1), search_start, -1):
        if text[i] in '.!?' and i + 1 < len(text) and text[i + 1] in ' \n':
            return i + 1
    
    # Priority 4: Word boundary
    space = text.rfind(' ', search_start, search_end)
    if space > search_start:
        return space
    
    return end


def chunk_text_semantic(text: str, max_chunk_size: int = 1500, min_chunk_size: int = 500) -> List[str]:
    """
    Semantic chunking that respects legal document structure.
    Preserves sections, articles, and clauses together when possible.
    Memory-efficient for large documents.
    """
    if not text:
        return []
    
    # Safety: Limit maximum text size to prevent memory errors (10MB limit)
    MAX_TEXT_SIZE = 10 * 1024 * 1024  # 10MB
    if len(text) > MAX_TEXT_SIZE:
        print(f"[Chunk] Warning: Text too large ({len(text)} chars), truncating to {MAX_TEXT_SIZE}")
        text = text[:MAX_TEXT_SIZE]
    
    # First try to split by major sections
    sections = _split_by_sections(text)
    
    chunks = []
    current_chunk = []
    current_size = 0
    
    for section in sections:
        section_len = len(section)
        
        # If section is extremely large, pre-split it
        if section_len > max_chunk_size * 2:
            # Process large sections in smaller pieces to avoid memory issues
            sub_chunks = chunk_text(section, max_chunk_size, 200)
            # Flush current chunk first
            if current_chunk:
                chunks.append('\n\n'.join(current_chunk))
                current_chunk = []
                current_size = 0
            # Add all sub-chunks
            chunks.extend(sub_chunks)
            continue
        
        # If section fits in current chunk
        if current_size + section_len <= max_chunk_size:
            current_chunk.append(section)
            current_size += section_len
        else:
            # Save current chunk if it's big enough
            if current_size >= min_chunk_size:
                chunks.append('\n\n'.join(current_chunk))
                current_chunk = [section]
                current_size = section_len
            else:
                # Split the section further
                if current_chunk:
                    chunks.append('\n\n'.join(current_chunk))
                    current_chunk = []
                    current_size = 0
                
                # Process section in smaller chunks
                sub_chunks = chunk_text(section, max_chunk_size, 200)
                if sub_chunks:
                    # Add all but last to chunks
                    chunks.extend(sub_chunks[:-1])
                    # Keep last as start of new current_chunk
                    current_chunk = [sub_chunks[-1]]
                    current_size = len(sub_chunks[-1])
    
    # Add remaining content
    if current_chunk:
        final_chunk = '\n\n'.join(current_chunk)
        if len(final_chunk) >= min_chunk_size or not chunks:
            chunks.append(final_chunk)
        elif chunks:
            # Merge with previous chunk
            chunks[-1] = chunks[-1] + '\n\n' + final_chunk
    
    return chunks


def _split_by_sections(text: str) -> List[str]:
    """Split text by legal section boundaries."""
    # Pattern for common legal section headers
    section_pattern = r'(?:\n|^)(?:Article|Section|Clause|\d+[\.\)]\s+[A-Z]|\([a-z]\)|[A-Z][A-Z\s]{3,})\s+'
    
    # Find all section boundaries
    matches = list(re.finditer(section_pattern, text))
    
    if not matches:
        return [text]
    
    sections = []
    last_end = 0
    
    for i, match in enumerate(matches):
        if i == 0 and match.start() > 0:
            # Content before first section
            sections.append(text[:match.start()].strip())
        
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        sections.append(text[start:end].strip())
    
    # Filter out empty sections
    return [s for s in sections if s]


def create_sliding_windows(text: str, window_size: int = 512, stride: int = 256) -> List[Tuple[str, int]]:
    """
    Create sliding windows for processing with position info.
    Returns list of (text, start_position) tuples.
    """
    if not text:
        return []
    
    windows = []
    start = 0
    text_len = len(text)
    
    while start < text_len:
        end = min(start + window_size, text_len)
        window_text = text[start:end].strip()
        if window_text:
            windows.append((window_text, start))
        start += stride
    
    return windows
