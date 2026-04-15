"""
Gemini API client for AI insights and text generation.
Alternative to OpenAI and LM Studio.
Get API key from: https://ai.google.dev/
"""
import os
import json
from typing import Dict, List, Optional
import requests
from django.conf import settings


class GeminiClient:
    """Google Gemini API client."""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('GEMINI_API_KEY') or getattr(settings, 'GEMINI_API_KEY', '')
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self.model = "gemini-1.5-flash"  # or "gemini-1.5-pro" for better quality
        
    def _call_api(self, prompt: str, max_tokens: int = 800) -> str:
        """Call Gemini API."""
        if not self.api_key:
            return "Error: GEMINI_API_KEY not set"
        
        url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
        
        headers = {
            "Content-Type": "application/json"
        }
        
        data = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "maxOutputTokens": max_tokens,
                "temperature": 0.7
            }
        }
        
        try:
            response = requests.post(url, headers=headers, json=data, timeout=60)
            
            if response.status_code == 200:
                result = response.json()
                if 'candidates' in result and len(result['candidates']) > 0:
                    content = result['candidates'][0].get('content', {})
                    parts = content.get('parts', [])
                    if parts:
                        return parts[0].get('text', '').strip()
                return "No response generated"
            else:
                return f"Error: Gemini API returned {response.status_code}: {response.text}"
                
        except Exception as e:
            return f"Error calling Gemini API: {str(e)}"
    
    def generate_summary(self, title: str, description: str, max_length: int = 300) -> str:
        """Generate a concise summary of the book."""
        text_to_summarize = description[:2000]
        
        prompt = f"""Provide a concise summary (max {max_length} characters) of this book:

Title: {title}

Description: {text_to_summarize}

Summary:"""
        
        summary = self._call_api(prompt, max_tokens=400)
        return summary[:max_length]
    
    def classify_genre(self, title: str, description: str) -> str:
        """Predict the genre based on description."""
        text_to_analyze = description[:2000]
        
        prompt = f"""Based on the following book description, classify the genre into ONE of these categories:
Fiction, Science Fiction, Fantasy, Mystery, Thriller, Romance, Horror, Historical Fiction, 
Literary Fiction, Biography, History, Science, Self-Help, Business, Technology, or Other.

Title: {title}

Description: {text_to_analyze}

Genre (respond with just the genre name):"""
        
        genre = self._call_api(prompt, max_tokens=50)
        return genre.strip()
    
    def analyze_sentiment(self, reviews: List[str]) -> Dict:
        """Analyze sentiment of book reviews."""
        if not reviews:
            return {'sentiment': 'neutral', 'score': 0.5, 'explanation': 'No reviews available'}
        
        combined = ' '.join(reviews[:5])
        combined = combined[:2000]
        
        prompt = f"""Analyze the sentiment of these book reviews. Respond in JSON format with keys: 
"sentiment" (positive/negative/neutral), "score" (0-1), and "explanation" (brief).

Reviews: {combined}

JSON response:"""
        
        response = self._call_api(prompt, max_tokens=200)
        
        try:
            # Try to extract JSON
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                result = json.loads(response[json_start:json_end])
                return result
        except:
            pass
        
        # Fallback
        return {
            'sentiment': 'neutral',
            'score': 0.5,
            'explanation': response[:200]
        }
    
    def answer_question(self, question: str, context: str) -> str:
        """Answer question using context (for RAG)."""
        prompt = f"""You are a knowledgeable assistant answering questions about books.
Use the provided context to answer the question. If the answer is not in the context, say so.

Context:
{context[:3000]}

Question: {question}

Answer:"""
        
        return self._call_api(prompt, max_tokens=800)


# Factory function to get the configured LLM client
def get_llm_client():
    """
    Returns the appropriate LLM client based on configuration priority:
    1. LM Studio (local, no API key needed)
    2. Gemini (if GEMINI_API_KEY is set)
    3. OpenAI (if OPENAI_API_KEY is set)
    """
    # Check for Gemini API key
    if os.getenv('GEMINI_API_KEY'):
        return GeminiClient()
    
    # Check for OpenAI API key
    if os.getenv('OPENAI_API_KEY'):
        from .insights import AIInsightGenerator
        return AIInsightGenerator()
    
    # Default to LM Studio (local)
    from .insights import AIInsightGenerator
    return AIInsightGenerator()
