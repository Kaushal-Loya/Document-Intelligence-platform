"""
Smart text chunking strategies for RAG.
"""
import re
from typing import List


class TextChunker:
    """Advanced text chunking with multiple strategies."""
    
    def __init__(self, chunk_size: int = 500, overlap: int = 100):
        self.chunk_size = chunk_size
        self.overlap = overlap
    
    def chunk_by_paragraphs(self, text: str) -> List[str]:
        """
        Chunk text by paragraphs with overlap.
        Respects paragraph boundaries where possible.
        """
        # Split into paragraphs
        paragraphs = re.split(r'\n\s*\n', text)
        paragraphs = [p.strip() for p in paragraphs if p.strip()]
        
        chunks = []
        current_chunk = []
        current_length = 0
        
        for paragraph in paragraphs:
            paragraph_length = len(paragraph)
            
            if current_length + paragraph_length <= self.chunk_size:
                current_chunk.append(paragraph)
                current_length += paragraph_length
            else:
                # Save current chunk
                if current_chunk:
                    chunks.append(' '.join(current_chunk))
                
                # Start new chunk with overlap
                if current_chunk and self.overlap > 0:
                    # Take last portion of previous chunk for overlap
                    overlap_text = ' '.join(current_chunk)[-self.overlap:]
                    current_chunk = [overlap_text, paragraph]
                    current_length = len(overlap_text) + paragraph_length
                else:
                    current_chunk = [paragraph]
                    current_length = paragraph_length
        
        # Add final chunk
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks
    
    def chunk_by_sentences(self, text: str) -> List[str]:
        """
        Chunk by sentences with semantic boundaries.
        Uses sentence tokenizer for better coherence.
        """
        # Simple sentence splitting
        sentences = re.split(r'(?<=[.!?])\s+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        chunks = []
        current_chunk = []
        current_length = 0
        
        for sentence in sentences:
            sentence_length = len(sentence)
            
            if current_length + sentence_length <= self.chunk_size:
                current_chunk.append(sentence)
                current_length += sentence_length
            else:
                # Save current chunk
                if current_chunk:
                    chunks.append(' '.join(current_chunk))
                
                # Start new chunk
                current_chunk = [sentence]
                current_length = sentence_length
        
        # Add final chunk
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks
    
    def chunk_by_windows(self, text: str) -> List[tuple]:
        """
        Sliding window chunking with overlap.
        Returns list of (chunk_text, start_index, end_index) tuples.
        """
        words = text.split()
        chunks = []
        
        if len(words) <= self.chunk_size:
            return [(text, 0, len(text))]
        
        start = 0
        while start < len(words):
            end = min(start + self.chunk_size, len(words))
            chunk_words = words[start:end]
            chunk_text = ' '.join(chunk_words)
            
            # Calculate character positions
            char_start = len(' '.join(words[:start])) + (1 if start > 0 else 0)
            char_end = char_start + len(chunk_text)
            
            chunks.append((chunk_text, char_start, char_end))
            
            # Move with overlap
            start += (self.chunk_size - self.overlap)
            
            if end == len(words):
                break
        
        return chunks
    
    def smart_chunk(self, text: str, strategy: str = "paragraph") -> List[dict]:
        """
        Smart chunking that chooses best strategy based on text.
        Returns list of dicts with chunk data.
        """
        text = text.strip()
        
        if not text:
            return []
        
        # Choose strategy
        if strategy == "paragraph":
            chunks = self.chunk_by_paragraphs(text)
        elif strategy == "sentence":
            chunks = self.chunk_by_sentences(text)
        elif strategy == "window":
            windows = self.chunk_by_windows(text)
            return [
                {
                    'text': w[0],
                    'index': i,
                    'char_start': w[1],
                    'char_end': w[2]
                }
                for i, w in enumerate(windows)
            ]
        else:
            chunks = self.chunk_by_paragraphs(text)
        
        return [
            {
                'text': chunk,
                'index': i,
                'char_start': None,
                'char_end': None
            }
            for i, chunk in enumerate(chunks)
        ]
