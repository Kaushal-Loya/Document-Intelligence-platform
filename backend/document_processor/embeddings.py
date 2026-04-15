"""
Embedding generation and vector storage using ChromaDB.
"""
import os
import hashlib
from typing import List, Dict, Optional
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer


class EmbeddingStore:
    """Manages embeddings and vector storage."""
    
    def __init__(self, db_path: str = None, collection_name: str = "book_chunks"):
        self.db_path = db_path or os.getenv('CHROMA_DB_PATH', './chroma_db')
        self.collection_name = collection_name
        
        # Initialize ChromaDB
        self.client = chromadb.PersistentClient(
            path=self.db_path,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )
        
        # Load embedding model
        print("Loading embedding model...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        print("Embedding model loaded.")
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text."""
        embedding = self.model.encode(text, convert_to_list=True)
        return embedding
    
    def add_chunks(self, chunks: List[Dict], book_id: int) -> List[str]:
        """
        Add chunks to vector store.
        Returns list of ChromaDB IDs.
        """
        ids = []
        embeddings = []
        documents = []
        metadatas = []
        
        for chunk in chunks:
            # Generate unique ID
            content_hash = hashlib.md5(
                f"{book_id}:{chunk['text'][:100]}".encode()
            ).hexdigest()
            chunk_id = f"book_{book_id}_chunk_{chunk['index']}_{content_hash[:8]}"
            
            # Generate embedding
            embedding = self.generate_embedding(chunk['text'])
            
            ids.append(chunk_id)
            embeddings.append(embedding)
            documents.append(chunk['text'])
            metadatas.append({
                'book_id': book_id,
                'chunk_index': chunk['index'],
                'char_start': chunk.get('char_start'),
                'char_end': chunk.get('char_end')
            })
        
        # Add to ChromaDB
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )
        
        return ids
    
    def search(self, query: str, book_id: Optional[int] = None, 
               n_results: int = 5) -> List[Dict]:
        """
        Search for similar chunks.
        If book_id is provided, filters to that book.
        """
        query_embedding = self.generate_embedding(query)
        
        # Build where clause
        where_clause = None
        if book_id:
            where_clause = {"book_id": book_id}
        
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where_clause,
            include=['documents', 'metadatas', 'distances']
        )
        
        # Format results
        formatted_results = []
        for i in range(len(results['ids'][0])):
            formatted_results.append({
                'id': results['ids'][0][i],
                'text': results['documents'][0][i],
                'metadata': results['metadatas'][0][i],
                'distance': results['distances'][0][i],
                'similarity': 1 - results['distances'][0][i]
            })
        
        return formatted_results
    
    def delete_book_chunks(self, book_id: int):
        """Delete all chunks for a book."""
        self.collection.delete(where={"book_id": book_id})
    
    def get_collection_stats(self) -> Dict:
        """Get statistics about the collection."""
        return {
            'total_chunks': self.collection.count(),
            'collection_name': self.collection_name
        }
