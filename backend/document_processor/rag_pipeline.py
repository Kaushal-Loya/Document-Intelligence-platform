"""
RAG (Retrieval Augmented Generation) Pipeline.
"""
from typing import Dict, List, Optional
import requests
from django.conf import settings
from .embeddings import EmbeddingStore


class RAGPipeline:
    """Complete RAG pipeline for question answering."""
    
    def __init__(self):
        self.embedding_store = EmbeddingStore()
        self.lm_studio_url = getattr(settings, 'LM_STUDIO_URL', 'http://localhost:1234/v1')
        self.model = getattr(settings, 'LM_STUDIO_MODEL', 'local-model')
    
    def retrieve_context(self, query: str, book_id: Optional[int] = None, 
                         top_k: int = 5) -> List[Dict]:
        """
        Retrieve relevant chunks from vector store.
        """
        results = self.embedding_store.search(
            query=query,
            book_id=book_id,
            n_results=top_k
        )
        return results
    
    def construct_prompt(self, query: str, contexts: List[Dict]) -> str:
        """
        Construct prompt with retrieved context.
        """
        # Build context string
        context_text = ""
        for i, ctx in enumerate(contexts, 1):
            context_text += f"\n[Source {i}] {ctx['text'][:500]}...\n"
        
        prompt = f"""You are a knowledgeable assistant answering questions about books.
Use the provided context to answer the question. If the answer is not in the context, say so.
Always cite your sources using [Source X] notation.

Context:
{context_text}

Question: {query}

Answer (cite sources like [Source 1], [Source 2]):
"""
        return prompt
    
    def generate_answer(self, prompt: str) -> str:
        """
        Generate answer using LLM.
        """
        try:
            response = requests.post(
                f"{self.lm_studio_url}/chat/completions",
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": "You are a helpful book assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 800,
                    "temperature": 0.7
                },
                timeout=60
            )
            
            if response.status_code == 200:
                return response.json()['choices'][0]['message']['content']
            else:
                return f"Error: LLM returned status {response.status_code}"
                
        except Exception as e:
            return f"Error generating answer: {str(e)}"
    
    def answer_question(self, query: str, book_id: Optional[int] = None) -> Dict:
        """
        Full RAG pipeline: retrieve, construct, generate.
        """
        # 1. Retrieve relevant chunks
        contexts = self.retrieve_context(query, book_id)
        
        if not contexts:
            return {
                'answer': 'No relevant information found in the knowledge base.',
                'sources': [],
                'contexts_used': 0
            }
        
        # 2. Construct prompt
        prompt = self.construct_prompt(query, contexts)
        
        # 3. Generate answer
        answer = self.generate_answer(prompt)
        
        # 4. Format sources
        sources = [
            {
                'book_id': ctx['metadata']['book_id'],
                'chunk_index': ctx['metadata']['chunk_index'],
                'text': ctx['text'][:200],
                'similarity': round(ctx['similarity'], 3)
            }
            for ctx in contexts
        ]
        
        return {
            'answer': answer,
            'sources': sources,
            'contexts_used': len(contexts)
        }
    
    def answer_with_caching(self, query: str, book_id: Optional[int] = None,
                          cache_check_func=None, cache_save_func=None) -> Dict:
        """
        RAG with caching support.
        """
        # Check cache
        if cache_check_func:
            cached = cache_check_func(query, book_id)
            if cached:
                return {
                    'answer': cached['response'],
                    'sources': cached.get('sources', []),
                    'cached': True
                }
        
        # Generate fresh answer
        result = self.answer_question(query, book_id)
        result['cached'] = False
        
        # Save to cache
        if cache_save_func:
            cache_save_func(query, book_id, result['answer'], result['sources'])
        
        return result
