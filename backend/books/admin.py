"""Admin configuration for Book Intelligence Platform."""
from django.contrib import admin
from .models import Book, BookChunk, ChatHistory


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'genre', 'rating', 'sentiment', 'ai_processed', 'is_embedded', 'created_at']
    list_filter = ['genre', 'sentiment', 'ai_processed', 'is_embedded']
    search_fields = ['title', 'author', 'description']
    readonly_fields = ['created_at', 'updated_at', 'scraped_at']
    ordering = ['-created_at']


@admin.register(BookChunk)
class BookChunkAdmin(admin.ModelAdmin):
    list_display = ['book', 'chunk_index', 'embedding_id']
    list_filter = ['book']
    search_fields = ['chunk_text', 'book__title']


@admin.register(ChatHistory)
class ChatHistoryAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'question', 'created_at']
    list_filter = ['session_id']
    search_fields = ['question', 'answer']
    readonly_fields = ['created_at']
