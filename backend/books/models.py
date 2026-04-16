"""
Book models for the Document Intelligence Platform.
"""
from django.db import models
from django.utils import timezone


class Book(models.Model):
    """Main book model storing scraped metadata and AI-generated insights."""

    GENRE_CHOICES = [
        ('fiction', 'Fiction'),
        ('non-fiction', 'Non-Fiction'),
        ('science', 'Science'),
        ('history', 'History'),
        ('biography', 'Biography'),
        ('fantasy', 'Fantasy'),
        ('mystery', 'Mystery'),
        ('romance', 'Romance'),
        ('sci-fi', 'Science Fiction'),
        ('thriller', 'Thriller'),
        ('self-help', 'Self Help'),
        ('philosophy', 'Philosophy'),
        ('classics', 'Classics'),
        ('other', 'Other'),
    ]

    SENTIMENT_CHOICES = [
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
        ('mixed', 'Mixed'),
    ]

    # Core metadata
    title = models.CharField(max_length=500, db_index=True)
    author = models.CharField(max_length=300, blank=True, default='')
    description = models.TextField(blank=True, default='')
    cover_image = models.URLField(max_length=1000, blank=True, default='')
    book_url = models.URLField(max_length=1000, blank=True, default='')

    # Ratings
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    reviews_count = models.IntegerField(default=0)

    # AI-generated insights
    summary = models.TextField(blank=True, default='')
    genre = models.CharField(max_length=50, choices=GENRE_CHOICES, blank=True, default='other')
    sentiment = models.CharField(max_length=20, choices=SENTIMENT_CHOICES, blank=True, default='neutral')
    sentiment_score = models.DecimalField(max_digits=4, decimal_places=3, null=True, blank=True)

    # Processing status
    is_embedded = models.BooleanField(default=False)
    ai_processed = models.BooleanField(default=False)

    # Timestamps
    scraped_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'books'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['genre']),
            models.Index(fields=['rating']),
            models.Index(fields=['author']),
        ]

    def __str__(self):
        return f"{self.title} by {self.author}"


class BookChunk(models.Model):
    """Text chunks from book descriptions for RAG retrieval."""

    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='chunks')
    chunk_text = models.TextField()
    chunk_index = models.IntegerField(default=0)
    embedding_id = models.CharField(max_length=200, blank=True, default='')  # ChromaDB doc ID

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'book_chunks'
        ordering = ['book', 'chunk_index']

    def __str__(self):
        return f"Chunk {self.chunk_index} of '{self.book.title}'"


class ChatHistory(models.Model):
    """Stores Q&A conversation history for each session."""

    session_id = models.CharField(max_length=100, db_index=True)
    question = models.TextField()
    answer = models.TextField()
    sources = models.JSONField(default=list)  # list of book ids/titles used
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'chat_history'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.session_id}] {self.question[:50]}..."
