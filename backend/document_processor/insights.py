"""
AI insight generation for books.
Generates: summary, genre classification, sentiment analysis, recommendations.
"""
import json
from typing import Dict, List, Optional
import requests
from django.conf import settings


class AIInsightGenerator:
    """Generates AI-based insights for books."""
    
    def __init__(self):
        self.lm_studio_url = getattr(settings, 'LM_STUDIO_URL', 'http://localhost:1234/v1')
        self.model = getattr(settings, 'LM_STUDIO_MODEL', 'local-model')
        self.openai_key = getattr(settings, 'OPENAI_API_KEY', '')
        
    def _call_llm(self, prompt: str, max_tokens: int = 500) -> str:
        """Call local LM Studio or OpenAI API."""
        try:
            # Try LM Studio first (local)
            response = requests.post(
                f"{self.lm_studio_url}/chat/completions",
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": "You are a helpful assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": max_tokens,
                    "temperature": 0.7
                },
                timeout=60
            )
            
            if response.status_code == 200:
                return response.json()['choices'][0]['message']['content']
            
            # Fallback message if LLM not available
            return "AI analysis unavailable. Please ensure LM Studio is running."
            
        except Exception as e:
            print(f"LLM call error: {e}")
            return f"Error: {str(e)}"
    
    def generate_summary(self, title: str, description: str, max_length: int = 300) -> str:
        """Generate a concise summary of the book."""
        text_to_summarize = description[:2000]  # Limit input
        
        prompt = f"""Provide a concise summary (max {max_length} characters) of this book:

Title: {title}

Description: {text_to_summarize}

Summary:"""
        
        summary = self._call_llm(prompt, max_tokens=400)
        return summary.strip()[:max_length]
    
    def classify_genre(self, title: str, description: str) -> str:
        """Predict the genre based on description."""
        text_to_analyze = description[:2000]
        
        prompt = f"""Based on the following book description, classify the genre into ONE of these categories:
Fiction, Science Fiction, Fantasy, Mystery, Thriller, Romance, Horror, Historical Fiction, 
Literary Fiction, Biography, History, Science, Self-Help, Business, Technology, or Other.

Title: {title}

Description: {text_to_analyze}

Genre (respond with just the genre name):"""
        
        genre = self._call_llm(prompt, max_tokens=50)
        return genre.strip()
    
    def analyze_sentiment(self, reviews: List[str]) -> Dict:
        """Analyze sentiment of book reviews."""
        if not reviews:
            return {'sentiment': 'neutral', 'score': 0.5, 'explanation': 'No reviews available'}
        
        # Combine reviews
        combined = ' '.join(reviews[:5])  # Use first 5 reviews
        combined = combined[:2000]
        
        prompt = f"""Analyze the sentiment of these book reviews. Respond in JSON format with keys: 
"sentiment" (positive/negative/neutral), "score" (0-1), and "explanation" (brief).

Reviews: {combined}

JSON response:"""
        
        response = self._call_llm(prompt, max_tokens=200)
        
        try:
            # Try to parse JSON
            json_str = response[response.find('{'):response.rfind('}')+1]
            result = json.loads(json_str)
            return result
        except:
            # Fallback
            return {
                'sentiment': 'neutral',
                'score': 0.5,
                'explanation': response[:200]
            }
    
    def generate_recommendation_reasoning(self, source_book: Dict, 
                                         target_book: Dict) -> str:
        """
        Generate "If you like X, you'll like Y" reasoning.
        """
        prompt = f"""Explain why someone who likes "{source_book['title']}" would also enjoy "{target_book['title']}".
Keep it under 150 characters.

{source_book['title']}: {source_book.get('description', 'No description')[:500]}
{target_book['title']}: {target_book.get('description', 'No description')[:500]}

Reasoning:"""
        
        reasoning = self._call_llm(prompt, max_tokens=100)
        return reasoning.strip()[:150]
    
    def find_similar_books(self, book: Dict, all_books: List[Dict], 
                           top_n: int = 5) -> List[Dict]:
        """
        Find similar books based on genre and description.
        Returns list of recommended books with reasoning.
        """
        if len(all_books) <= 1:
            return []
        
        # Filter out the source book
        candidates = [b for b in all_books if b['id'] != book.get('id')]
        
        # Simple similarity based on genre match and description keywords
        scored_candidates = []
        book_genre = book.get('genre', '').lower()
        book_desc = book.get('description', '').lower()
        
        for candidate in candidates:
            score = 0
            
            # Genre match
            if book_genre and book_genre in candidate.get('genre', '').lower():
                score += 3
            
            # Description similarity (simple keyword overlap)
            candidate_desc = candidate.get('description', '').lower()
            book_words = set(book_desc.split())
            candidate_words = set(candidate_desc.split())
            overlap = len(book_words & candidate_words)
            score += min(overlap / 10, 2)  # Cap at 2 points
            
            scored_candidates.append((candidate, score))
        
        # Sort by score and get top N
        scored_candidates.sort(key=lambda x: x[1], reverse=True)
        top_candidates = scored_candidates[:top_n]
        
        # Generate reasoning for each
        recommendations = []
        for candidate, score in top_candidates:
            if score > 0:
                reasoning = self.generate_recommendation_reasoning(book, candidate)
                recommendations.append({
                    'book': candidate,
                    'reasoning': reasoning,
                    'similarity_score': score
                })
        
        return recommendations
    
    def generate_all_insights(self, book_data: Dict) -> Dict:
        """Generate all AI insights for a book."""
        insights = {}
        
        # Summary
        if book_data.get('description'):
            insights['summary'] = self.generate_summary(
                book_data['title'],
                book_data['description']
            )
        
        # Genre
        if book_data.get('description'):
            insights['genre'] = self.classify_genre(
                book_data['title'],
                book_data['description']
            )
        
        # Sentiment
        if book_data.get('raw_reviews'):
            sentiment_result = self.analyze_sentiment(book_data['raw_reviews'])
            insights['sentiment'] = sentiment_result.get('sentiment', 'neutral')
        
        return insights
