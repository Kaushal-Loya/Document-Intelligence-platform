"""
API Views for Book Insight Platform.
"""
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
import uuid

from .models import Book, BookChunk, QueryCache, ChatHistory
from .serializers import (
    BookListSerializer, BookDetailSerializer, BookCreateSerializer,
    AskQuestionSerializer, AnswerSerializer, ChatHistorySerializer
)
from document_processor.scraper import BookScraper
from document_processor.chunker import TextChunker
from document_processor.embeddings import EmbeddingStore
from document_processor.insights import AIInsightGenerator
from document_processor.rag_pipeline import RAGPipeline


def get_cache_or_none(query: str, book_id: int = None):
    """Helper to check query cache."""
    query_hash = QueryCache.get_hash(query, book_id)
    try:
        cache = QueryCache.objects.get(query_hash=query_hash)
        return {
            'response': cache.response,
            'sources': cache.sources
        }
    except QueryCache.DoesNotExist:
        return None


def save_to_cache(query: str, book_id: int, response: str, sources: list):
    """Helper to save to query cache."""
    query_hash = QueryCache.get_hash(query, book_id)
    book = Book.objects.get(id=book_id) if book_id else None
    QueryCache.objects.create(
        query_hash=query_hash,
        query_text=query,
        response=response,
        book=book,
        sources=sources
    )


# ==================== BOOK APIs ====================

@api_view(['GET'])
def book_list(request):
    """
    GET /api/books
    List all books with pagination.
    """
    books = Book.objects.all()
    
    # Search filter
    search = request.query_params.get('search')
    if search:
        books = books.filter(
            Q(title__icontains=search) | 
            Q(author__icontains=search) |
            Q(genre__icontains=search)
        )
    
    # Genre filter
    genre = request.query_params.get('genre')
    if genre:
        books = books.filter(genre__icontains=genre)
    
    serializer = BookListSerializer(books, many=True)
    return Response({
        'count': len(serializer.data),
        'results': serializer.data
    })


@api_view(['GET'])
def book_detail(request, pk):
    """
    GET /api/books/<id>
    Get detailed info about a specific book.
    """
    book = get_object_or_404(Book, pk=pk)
    serializer = BookDetailSerializer(book)
    return Response(serializer.data)


@api_view(['GET'])
def book_recommendations(request, pk):
    """
    GET /api/books/<id>/recommendations
    Get book recommendations based on similarity.
    """
    book = get_object_or_404(Book, pk=pk)
    
    # Get all other books
    all_books = list(Book.objects.exclude(pk=pk).values(
        'id', 'title', 'author', 'description', 'genre', 'rating'
    ))
    
    if not all_books:
        return Response({'recommendations': []})
    
    # Use AI insight generator
    generator = AIInsightGenerator()
    current_book_data = {
        'id': book.id,
        'title': book.title,
        'description': book.description,
        'genre': book.genre
    }
    
    recommendations = generator.find_similar_books(current_book_data, all_books, top_n=5)
    
    # Format response
    formatted_recs = []
    for rec in recommendations:
        formatted_recs.append({
            'id': rec['book']['id'],
            'title': rec['book']['title'],
            'author': rec['book']['author'],
            'genre': rec['book']['genre'],
            'rating': rec['book']['rating'],
            'reasoning': rec['reasoning'],
            'similarity_score': rec['similarity_score']
        })
    
    return Response({
        'book_id': pk,
        'book_title': book.title,
        'recommendations': formatted_recs
    })


@api_view(['POST'])
def book_create(request):
    """
    POST /api/books
    Upload and process a new book via URL scraping.
    """
    serializer = BookCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    book_url = serializer.validated_data['book_url']
    
    # Scrape the book
    scraper = BookScraper(headless=True)
    
    # Detect source and scrape accordingly
    if 'goodreads.com' in book_url:
        book_data = scraper.scrape_goodreads(book_url)
    else:
        book_data = scraper.scrape_generic(book_url)
    
    if book_data.get('error'):
        return Response(
            {'error': f"Failed to scrape: {book_data['error']}"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create book in database
    book = Book.objects.create(
        title=book_data['title'],
        author=book_data['author'],
        rating=book_data['rating'],
        reviews_count=book_data['reviews_count'],
        description=book_data['description'],
        book_url=book_data['book_url']
    )
    
    # Generate AI insights
    generator = AIInsightGenerator()
    insights = generator.generate_all_insights(book_data)
    
    # Update book with insights
    book.summary = insights.get('summary', '')
    book.genre = insights.get('genre', '')
    book.sentiment = insights.get('sentiment', '')
    book.save()
    
    # Chunk and embed the description
    chunker = TextChunker(chunk_size=500, overlap=100)
    chunks = chunker.smart_chunk(book_data['description'], strategy='paragraph')
    
    # Add to vector store
    embedding_store = EmbeddingStore()
    chroma_ids = embedding_store.add_chunks(chunks, book.id)
    
    # Save chunk references
    for i, (chunk, chroma_id) in enumerate(zip(chunks, chroma_ids)):
        BookChunk.objects.create(
            book=book,
            chunk_text=chunk['text'],
            chunk_index=chunk['index'],
            chroma_id=chroma_id
        )
    
    # Mark as processed
    book.is_processed = True
    book.save()
    
    return Response({
        'message': 'Book processed successfully',
        'book': BookDetailSerializer(book).data,
        'chunks_created': len(chunks),
        'insights_generated': list(insights.keys())
    }, status=status.HTTP_201_CREATED)


# ==================== Q&A APIs ====================

@api_view(['POST'])
def ask_question(request):
    """
    POST /api/ask
    Ask a question about books using RAG.
    """
    serializer = AskQuestionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    question = serializer.validated_data['question']
    book_id = serializer.validated_data.get('book_id')
    session_id = serializer.validated_data.get('session_id') or str(uuid.uuid4())
    
    # Initialize RAG pipeline
    rag = RAGPipeline()
    
    # Generate answer with caching
    result = rag.answer_with_caching(
        query=question,
        book_id=book_id,
        cache_check_func=get_cache_or_none,
        cache_save_func=save_to_cache
    )
    
    # Save to chat history
    ChatHistory.objects.create(
        session_id=session_id,
        book_id=book_id,
        question=question,
        answer=result['answer'],
        sources=result.get('sources', [])
    )
    
    # Get related book info
    book_info = None
    if book_id:
        try:
            book = Book.objects.get(id=book_id)
            book_info = {'id': book.id, 'title': book.title}
        except Book.DoesNotExist:
            pass
    
    return Response({
        'question': question,
        'answer': result['answer'],
        'sources': result.get('sources', []),
        'cached': result.get('cached', False),
        'book': book_info,
        'session_id': session_id
    })


@api_view(['GET'])
def chat_history(request, session_id):
    """
    GET /api/chat/<session_id>/history
    Get chat history for a session.
    """
    chats = ChatHistory.objects.filter(session_id=session_id).order_by('created_at')
    serializer = ChatHistorySerializer(chats, many=True)
    return Response({
        'session_id': session_id,
        'messages': serializer.data
    })


@api_view(['GET'])
def genres_list(request):
    """
    GET /api/genres
    Get list of all genres.
    """
    genres = Book.objects.exclude(genre='').values_list('genre', flat=True).distinct()
    return Response({'genres': list(genres)})


@api_view(['GET'])
def stats(request):
    """
    GET /api/stats
    Get system statistics.
    """
    embedding_store = EmbeddingStore()
    
    return Response({
        'total_books': Book.objects.count(),
        'processed_books': Book.objects.filter(is_processed=True).count(),
        'total_chunks': BookChunk.objects.count(),
        'vector_store_stats': embedding_store.get_collection_stats(),
        'cached_queries': QueryCache.objects.count(),
        'chat_sessions': ChatHistory.objects.values('session_id').distinct().count()
    })
