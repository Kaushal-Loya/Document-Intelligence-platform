"""Serializers for Book Intelligence Platform API."""
from rest_framework import serializers
from .models import Book, BookChunk, ChatHistory


class BookChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookChunk
        fields = ['id', 'chunk_text', 'chunk_index']


class BookListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing books on the dashboard."""

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'rating', 'reviews_count',
            'cover_image', 'book_url', 'genre', 'sentiment',
            'summary', 'ai_processed', 'created_at',
        ]


class BookDetailSerializer(serializers.ModelSerializer):
    """Full serializer for the book detail page."""
    chunks = BookChunkSerializer(many=True, read_only=True)

    class Meta:
        model = Book
        fields = '__all__'


class BookUploadSerializer(serializers.Serializer):
    """Serializer for uploading a book manually."""
    title = serializers.CharField(max_length=500)
    author = serializers.CharField(max_length=300, required=False, default='')
    description = serializers.CharField(required=False, default='')
    cover_image = serializers.URLField(required=False, default='')
    book_url = serializers.URLField(required=False, default='')
    rating = serializers.DecimalField(max_digits=3, decimal_places=2, required=False, allow_null=True)
    reviews_count = serializers.IntegerField(required=False, default=0)


class AskSerializer(serializers.Serializer):
    """Serializer for the RAG Q&A endpoint."""
    question = serializers.CharField(min_length=3, max_length=1000)
    session_id = serializers.CharField(max_length=100, required=False, default='default')
    book_id = serializers.IntegerField(required=False, allow_null=True, default=None)


class ChatHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatHistory
        fields = ['id', 'session_id', 'question', 'answer', 'sources', 'created_at']
