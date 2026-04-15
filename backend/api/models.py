from django.db import models
import hashlib


class Book(models.Model):
    """Book model for storing metadata."""
    title = models.CharField(max_length=500)
    author = models.CharField(max_length=255, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    reviews_count = models.IntegerField(default=0)
    description = models.TextField(blank=True)
    book_url = models.URLField(blank=True)
    
    # AI-generated insights
    summary = models.TextField(blank=True, help_text="AI-generated summary")
    genre = models.CharField(max_length=100, blank=True, help_text="AI-predicted genre")
    sentiment = models.CharField(max_length=50, blank=True, help_text="Sentiment of reviews")
    
    # Processing status
    is_processed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'books'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} by {self.author}"


class BookChunk(models.Model):
    """Stores text chunks for RAG."""
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='chunks')
    chunk_text = models.TextField()
    chunk_index = models.IntegerField()
    chroma_id = models.CharField(max_length=255, blank=True, help_text="ID in ChromaDB")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'book_chunks'
        ordering = ['book', 'chunk_index']

    def __str__(self):
        return f"Chunk {self.chunk_index} of {self.book.title}"


class QueryCache(models.Model):
    """Cache for AI queries to avoid repeated calls."""
    query_hash = models.CharField(max_length=64, unique=True, db_index=True)
    query_text = models.TextField()
    response = models.TextField()
    book = models.ForeignKey(Book, on_delete=models.CASCADE, null=True, blank=True, related_name='cached_queries')
    sources = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'query_cache'

    @classmethod
    def get_hash(cls, query, book_id=None):
        """Generate hash for query + book combination."""
        content = f"{query}:{book_id or 'all'}"
        return hashlib.sha256(content.encode()).hexdigest()

    def __str__(self):
        return f"Cache: {self.query_text[:50]}..."


class ChatHistory(models.Model):
    """Store chat conversations."""
    session_id = models.CharField(max_length=100, db_index=True)
    book = models.ForeignKey(Book, on_delete=models.CASCADE, null=True, blank=True, related_name='chat_history')
    question = models.TextField()
    answer = models.TextField()
    sources = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_history'
        ordering = ['created_at']

    def __str__(self):
        return f"Chat: {self.question[:50]}..."
