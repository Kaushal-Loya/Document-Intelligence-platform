"""
Gemini API integration using the new google-genai SDK.
Handles AI insight generation (summary, genre, sentiment) and RAG Q&A.
"""
import os
import json
import time
from django.conf import settings
from django.core.cache import cache
from google import genai
from google.genai import types

# Rate limiting: free tier = ~15 RPM
RATE_LIMIT_DELAY = 6.0  # seconds between calls

# Initialise client lazily
_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = getattr(settings, 'GEMINI_API_KEY', os.getenv('GEMINI_API_KEY', ''))
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set. Add it to backend/.env")
        _client = genai.Client(api_key=api_key)
    return _client


def _call_gemini(prompt: str, cache_key: str = None, max_tokens: int = 1024) -> str:
    """
    Calls Gemini 1.5 Flash with optional caching and rate-limit delay.
    Returns the response text or empty string on error.
    """
    if cache_key:
        cached = cache.get(cache_key)
        if cached:
            return cached

    try:
        client = _get_client()
        time.sleep(RATE_LIMIT_DELAY)  # respect free-tier rate limits

        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=max_tokens,
                temperature=0.3,
            ),
        )
        result = response.text.strip()

        if cache_key:
            cache.set(cache_key, result, timeout=86400)  # 24-hour cache

        return result

    except Exception as e:
        print(f"[Gemini] API error: {e}")
        return ""





# ────────────────────────────────────────────────
# RAG: Answer Generation
# ────────────────────────────────────────────────
def generate_rag_answer(question: str, context_chunks: list[str], source_books: list[dict]) -> str:
    """
    Generates a grounded, cited answer from RAG context chunks.
    """
    if not context_chunks:
        return ("I don't have enough information to answer that. "
                "Try adding more books to the library first via the Scrape Books button.")

    context_text = "\n\n---\n\n".join(context_chunks[:5])
    sources_text = ", ".join(f"'{b.get('title', 'Unknown')}'" for b in source_books)

    prompt = f"""You are a knowledgeable book assistant. Answer the question using ONLY the provided context.
Be specific and cite sources naturally (e.g. "According to '[Book Title]'...").
If the context is insufficient, say so honestly.

Context from books ({sources_text}):
{context_text}

Question: {question}

Answer:"""

    result = _call_gemini(prompt, max_tokens=600)
    return result or "I couldn't generate an answer. Please try rephrasing your question."


# ────────────────────────────────────────────────
# Smart Ingest: Metadata Generation
# ────────────────────────────────────────────────
def gen_book_metadata(input_str: str) -> dict:
    """
    Core Smart Ingest AI handler.
    Constructs a high-context prompt for Gemini to extract or synthesize book metadata.
    Utilizes system instructions for Native JSON return format.
    """
    prompt = f"""Extract or generate accurate book metadata for: {input_str}
    
    Return a JSON object with:
    {{
        "title": "Book Title",
        "author": "Author Name",
        "description": "Full description",
        "genre": "one of: fiction, non-fiction, science, history, biography, fantasy, mystery, romance, sci-fi, thriller, self-help, philosophy, classics, other",
        "rating": 4.5,
        "reviews_count": 1000
    }}"""

    try:
        client = _get_client()
        time.sleep(RATE_LIMIT_DELAY)
        
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=1500,
                temperature=0.2,
                response_mime_type='application/json',
            ),
        )
        
        data = json.loads(response.text)
        return {
            'title': data.get('title', 'Unknown').strip(),
            'author': data.get('author', 'Unknown').strip(),
            'description': data.get('description', '').strip(),
            'genre': data.get('genre', 'other').strip().lower(),
            'rating': float(data.get('rating', 4.0)) if data.get('rating') else 4.0,
            'reviews_count': int(data.get('reviews_count', 100)) if data.get('reviews_count') else 100
        }
    except Exception as e:
        print(f"[Gemini] Smart Ingest native error: {e}")
        # Clean fallback title from URL
        clean_title = input_str.split('/')[-1].split('?')[0].replace('-', ' ').replace('_', ' ').title()
        if len(clean_title) < 3: clean_title = input_str
        
        error_info = str(e)
        error_str = error_info.lower()
        if '429' in error_str or 'exhausted' in error_str or 'quota' in error_str:
             return {
                 "title": clean_title, 
                 "author": "Google API Limit", 
                 "description": "Smart Ingest aborted: Google Gemini API Daily Quota completely Exhausted!...", 
                 "genre": "other"
             }

        return {"title": clean_title, "author": "Found via URL", "description": f"AI extraction failed: {error_info[:100]}", "genre": "other"}


# ────────────────────────────────────────────────
# Combined: run all insights for one book
# ────────────────────────────────────────────────
def generate_all_insights(book) -> dict:
    """
    Orchestrates the combined AI analytical pipeline. 
    Performs summary isolation, genre classification, and sentiment mapping in a 
    single atomic API call to minimize latency and manage token quotas.
    """
    if not book.description or len(book.description) < 5:
        return {
            'summary': f"An engaging work titled '{book.title}'.",
            'genre': 'other',
            'sentiment': 'neutral',
            'sentiment_score': 0.0
        }

    prompt = f"""Analyze this book and return a JSON object with:
{{
    "author": "Extract the author's name from the title/description if available, or intelligently guess it based on real-world knowledge of the book. If absolutely unknown, write 'Anonymous'.",
    "summary": "Write a concise 2-3 sentence summary. Do not start with 'This book'.",
    "genre": "Classify using ONE word from: fiction, non-fiction, science, history, biography, fantasy, mystery, romance, sci-fi, thriller, self-help, philosophy, classics, other",
    "sentiment": "positive, neutral, or negative",
    "sentiment_score": a float from -1.0 to 1.0
}}

Title: {book.title}
Author: {book.author}
Description: {book.description[:1200]}"""

    try:
        print(f"  > Generating insights for '{book.title}'...")
        client = _get_client()
        time.sleep(RATE_LIMIT_DELAY) # Respect limit
        
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=500,
                temperature=0.2,
                response_mime_type='application/json',
            ),
        )
        
        data = json.loads(response.text)
        return {
            'author': data.get('author', 'Unknown Author').strip(),
            'summary': data.get('summary', '').strip(),
            'genre': data.get('genre', 'other').strip().lower(),
            'sentiment': data.get('sentiment', 'neutral').strip().lower(),
            'sentiment_score': float(data.get('sentiment_score', 0.0))
        }
    except Exception as e:
        print(f"[Gemini] Error generating combined insights: {e}")
        error_str = str(e).lower()
        if '429' in error_str or 'exhausted' in error_str or 'quota' in error_str:
            return {
                'author': 'Google API Limit',
                'summary': 'Batch Ingest aborted: Google Gemini API Daily Quota completely Exhausted! Google strictly caps the new 2.5-flash-lite free tier at exactly 20 requests per day per project. Please try again tomorrow.',
                'genre': 'other',
                'sentiment': 'neutral',
                'sentiment_score': 0.0
            }

        return {
            'author': book.author if book.author else 'Unknown Author',
            'summary': f"An engaging work by {book.author or 'Unknown Author'}.",
            'genre': 'other',
            'sentiment': 'neutral',
            'sentiment_score': 0.0
        }
