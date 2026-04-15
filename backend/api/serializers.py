from rest_framework import serializers
from .models import Book, BookChunk, ChatHistory


class BookListSerializer(serializers.ModelSerializer):
    """Serializer for book list view."""
    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'rating', 'reviews_count', 'description', 'book_url', 'genre', 'created_at']


class BookDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed book view."""
    chunks_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'rating', 'reviews_count', 
            'description', 'book_url', 'summary', 'genre', 'sentiment',
            'is_processed', 'chunks_count', 'created_at', 'updated_at'
        ]
    
    def get_chunks_count(self, obj):
        return obj.chunks.count()


class BookChunkSerializer(serializers.ModelSerializer):
    """Serializer for book chunks."""
    class Meta:
        model = BookChunk
        fields = ['id', 'chunk_index', 'chunk_text']


class BookCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating books via scraping."""
    book_url = serializers.URLField(required=True)
    
    class Meta:
        model = Book
        fields = ['book_url']


class AskQuestionSerializer(serializers.Serializer):
    """Serializer for question input."""
    question = serializers.CharField(required=True, min_length=3, max_length=1000)
    book_id = serializers.IntegerField(required=False, allow_null=True)
    session_id = serializers.CharField(required=False, max_length=100)


class AnswerSerializer(serializers.Serializer):
    """Serializer for answer response."""
    answer = serializers.CharField()
    sources = serializers.ListField(child=serializers.DictField(), required=False)
    cached = serializers.BooleanField(default=False)


class ChatHistorySerializer(serializers.ModelSerializer):
    """Serializer for chat history."""
    class Meta:
        model = ChatHistory
        fields = ['id', 'question', 'answer', 'sources', 'created_at']
