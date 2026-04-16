"""
Embedding generation using Gemini API.
Uses 'models/gemini-embedding-001' to bypass local HuggingFace blocks.
"""
from books.rag.llm import _get_client

CHUNK_SIZE = 400       # tokens approx (words)
CHUNK_OVERLAP = 80     # overlapping words between chunks

def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Generates embeddings for a list of texts using Gemini.
    Returns list of float vectors.
    """
    if not texts: return []
    
    client = _get_client()
    try:
        import time
        from books.rag.llm import RATE_LIMIT_DELAY
        time.sleep(RATE_LIMIT_DELAY) # Respect free tier 15 RPM limit
        
        response = client.models.embed_content(
            model='models/gemini-embedding-001',
            contents=texts
        )
        # response may return a mix of properties, usually response.embeddings contains vectors
        if hasattr(response, 'embeddings') and response.embeddings:
            return [e.values for e in response.embeddings]
        # In case the python SDK returns a list
        elif isinstance(response, list) and len(response) > 0 and hasattr(response[0], 'values'):
            return [e.values for e in response]
        return []
    except Exception as e:
        print(f"[Gemini Embeddings] Error generating vectors: {e}")
        return []

def embed_single(text: str) -> list[float]:
    """Generates a single embedding vector."""
    vectors = embed_texts([text])
    return vectors[0] if vectors else []


def chunk_text(text: str) -> list[str]:
    """
    Splits text into overlapping chunks using a sliding window strategy.
    This is a semantic-style chunking with overlap for better retrieval.
    """
    if not text or not text.strip():
        return []

    # Split into words preserving sentence boundaries
    words = text.split()
    if len(words) <= CHUNK_SIZE:
        return [text.strip()]

    chunks = []
    start = 0
    while start < len(words):
        end = min(start + CHUNK_SIZE, len(words))
        chunk = ' '.join(words[start:end])
        chunks.append(chunk.strip())
        if end >= len(words):
            break
        start += CHUNK_SIZE - CHUNK_OVERLAP  # slide with overlap

    return [c for c in chunks if len(c.strip()) > 20]


def process_book_for_embedding(book) -> tuple[list[str], list[list[float]]]:
    """
    Takes a Book model instance, creates chunks, and generates embeddings.
    Returns (chunks, embeddings).
    """
    # Build full text from available fields
    parts = []
    if book.title:
        parts.append(f"Title: {book.title}")
    if book.author:
        parts.append(f"Author: {book.author}")
    if book.description:
        parts.append(f"Description: {book.description}")
    if book.summary:
        parts.append(f"Summary: {book.summary}")
    if book.genre:
        parts.append(f"Genre: {book.genre}")

    full_text = "\n\n".join(parts)
    chunks = chunk_text(full_text)

    if not chunks:
        # Fallback: use title as minimum chunk
        chunks = [book.title]

    embeddings = embed_texts(chunks)
    return chunks, embeddings
