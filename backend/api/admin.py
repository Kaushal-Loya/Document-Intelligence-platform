from django.contrib import admin
from .models import Book, BookChunk, QueryCache, ChatHistory


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'genre', 'rating', 'is_processed', 'created_at']
    list_filter = ['genre', 'is_processed', 'created_at']
    search_fields = ['title', 'author', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(BookChunk)
class BookChunkAdmin(admin.ModelAdmin):
    list_display = ['book', 'chunk_index', 'chroma_id', 'created_at']
    list_filter = ['created_at']
    search_fields = ['book__title', 'chunk_text']


@admin.register(QueryCache)
class QueryCacheAdmin(admin.ModelAdmin):
    list_display = ['query_text', 'book', 'created_at']
    list_filter = ['created_at']
    search_fields = ['query_text']
    readonly_fields = ['query_hash', 'created_at']


@admin.register(ChatHistory)
class ChatHistoryAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'book', 'question_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['question', 'answer']
    
    def question_preview(self, obj):
        return obj.question[:50] + '...' if len(obj.question) > 50 else obj.question
    question_preview.short_description = 'Question'
