"""
API views for the Book Intelligence Platform.
All endpoints follow REST conventions.
"""
import threading
import logging
from django.utils import timezone
from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import Book, BookChunk, ChatHistory
from .serializers import (
    BookListSerializer, BookDetailSerializer,
    BookUploadSerializer, AskSerializer, ChatHistorySerializer
)
from .rag.embeddings import process_book_for_embedding, embed_single
from .rag.vector_store import add_chunks, similarity_search, delete_book_chunks
from .rag.llm import generate_all_insights, generate_rag_answer

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# Helper: full processing pipeline for a book
# ─────────────────────────────────────────────
def _process_book_pipeline(book: Book, generate_ai: bool = True):
    """Runs AI insight generation + embedding for a book (can run in background thread)."""
    try:
        if generate_ai and not book.ai_processed:
            insights = generate_all_insights(book)
            
            # Smart-override the dummy author if the AI discovered the true author
            extracted_author = insights.get('author', 'Unknown Author')
            if extracted_author and extracted_author.lower() not in ['unknown', 'anonymous', 'unknown author']:
                book.author = extracted_author

            book.summary = insights.get('summary', '')
            book.genre = insights.get('genre', book.genre or 'other')
            book.sentiment = insights.get('sentiment', 'neutral')
            book.sentiment_score = insights.get('sentiment_score', 0.0)
            book.ai_processed = True
            book.save()

        if not book.is_embedded:
            chunks, embeddings = process_book_for_embedding(book)
            embedding_ids = add_chunks(book.id, chunks, embeddings)

            BookChunk.objects.filter(book=book).delete()
            for i, (chunk_text, emb_id) in enumerate(zip(chunks, embedding_ids)):
                BookChunk.objects.create(
                    book=book, chunk_text=chunk_text,
                    chunk_index=i, embedding_id=emb_id
                )
            book.is_embedded = True
            book.save()

    except Exception as e:
        logger.error(f"Pipeline error for book {book.id}: {e}")


# ─────────────────────────────────────────────
# GET /api/books/   — List all books
# ─────────────────────────────────────────────
@api_view(['GET'])
def book_list(request):
    """
    List all books with optional search and genre filter.
    Query params: ?search=<term>&genre=<genre>&page=<n>
    """
    queryset = Book.objects.all()

    # Search
    search = request.query_params.get('search', '').strip()
    if search:
        queryset = queryset.filter(title__icontains=search) | \
                   queryset.filter(author__icontains=search)

    # Genre filter
    genre = request.query_params.get('genre', '').strip()
    if genre:
        queryset = queryset.filter(genre=genre)

    # Sort
    sort = request.query_params.get('sort', '-created_at')
    allowed_sorts = ['title', '-title', 'rating', '-rating', 'created_at', '-created_at', 'author']
    if sort not in allowed_sorts:
        sort = '-created_at'
    queryset = queryset.order_by(sort)

    # Paginate
    paginator = PageNumberPagination()
    paginator.page_size = 12
    page = paginator.paginate_queryset(queryset, request)
    serializer = BookListSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


# ─────────────────────────────────────────────
# GET /api/books/<id>/   — Book detail
# ─────────────────────────────────────────────
@api_view(['GET'])
def book_detail(request, pk):
    """Returns full details for a single book."""
    try:
        book = Book.objects.get(pk=pk)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = BookDetailSerializer(book)
    return Response(serializer.data)


# ─────────────────────────────────────────────
# DELETE /api/books/<id>/   — Delete a book
# ─────────────────────────────────────────────
@api_view(['DELETE'])
def book_delete(request, pk):
    """Deletes a book and cleans up its vectors from ChromaDB."""
    try:
        book = Book.objects.get(pk=pk)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found.'}, status=status.HTTP_404_NOT_FOUND)

    title = book.title
    # Remove from vector store
    try:
        delete_book_chunks(book.id)
    except Exception as e:
        logger.warning(f"Could not delete ChromaDB chunks for book {pk}: {e}")

    book.delete()
    return Response({'message': f"'{title}' deleted successfully."}, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────
# GET /api/books/<id>/recommend/   — Recommendations
# ─────────────────────────────────────────────
@api_view(['GET'])
def book_recommend(request, pk):
    """
    Returns up to 5 books similar to the given book.
    Uses embedding-based similarity search via ChromaDB.
    """
    try:
        book = Book.objects.get(pk=pk)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found.'}, status=status.HTTP_404_NOT_FOUND)

    cache_key = f"recommend_{pk}"
    cached = cache.get(cache_key)
    if cached:
        return Response({'results': cached})

    # Build query text
    query_text = f"{book.title} {book.author} {book.description[:500]}"
    query_embedding = embed_single(query_text)

    # Search for similar chunks (exclude the book itself)
    try:
        results = similarity_search(query_embedding, n_results=20)
        seen_ids = set()
        similar_book_ids = []

        for meta in (results.get('metadatas') or [[]])[0]:
            bid = meta.get('book_id')
            if bid and bid != book.id and bid not in seen_ids:
                seen_ids.add(bid)
                similar_book_ids.append(bid)
                if len(similar_book_ids) >= 5:
                    break

        similar_books = Book.objects.filter(id__in=similar_book_ids)
        serializer = BookListSerializer(similar_books, many=True)
        data = serializer.data
        cache.set(cache_key, data, timeout=3600)
        return Response({'results': data})

    except Exception as e:
        logger.error(f"Recommendation error: {e}")
        # Fallback: same genre
        fallbacks = Book.objects.filter(genre=book.genre).exclude(pk=pk)[:5]
        serializer = BookListSerializer(fallbacks, many=True)
        return Response({'results': serializer.data})


# ─────────────────────────────────────────────
# POST /api/books/upload/   — Upload a book manually
# ─────────────────────────────────────────────
@api_view(['POST'])
def book_upload(request):
    """
    Accepts book metadata, saves it, and triggers AI + embedding pipeline in background.
    """
    serializer = BookUploadSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    book = Book.objects.create(
        title=data['title'],
        author=data.get('author', ''),
        description=data.get('description', ''),
        cover_image=data.get('cover_image', ''),
        book_url=data.get('book_url', ''),
        rating=data.get('rating'),
        reviews_count=data.get('reviews_count', 0),
        scraped_at=timezone.now(),
    )

    # Run pipeline in background thread to return response fast
    thread = threading.Thread(target=_process_book_pipeline, args=(book,))
    thread.daemon = True
    thread.start()

    return Response(
        {
            'message': 'Book saved. AI processing started in background.',
            'book': BookListSerializer(book).data,
        },
        status=status.HTTP_201_CREATED
    )


# ─────────────────────────────────────────────
# POST /api/books/scrape/   — Trigger bulk scrape (Seed Failover)
# ─────────────────────────────────────────────
@api_view(['POST'])
def book_scrape(request):
    """
    Triggers the scraper in a background thread.
    Uses the Seed Archive for bulletproof availability.
    """
    max_per_subject = int(request.data.get('max_per_subject', 5))

    def run_scrape():
        from .scraper.open_library import run_scraper
        raw_books = run_scraper(max_per_subject=max_per_subject)
        logger.info(f"Bulk Ingest returned {len(raw_books)} books.")

        for book_data in raw_books:
            title = book_data.get('title', '').strip()
            if not title: continue
            try:
                book, created = Book.objects.get_or_create(
                    title__iexact=title,
                    defaults={
                        'title': title,
                        'author': book_data.get('author', ''),
                        'description': book_data.get('description', ''),
                        'cover_image': book_data.get('cover_image', ''),
                        'book_url': book_data.get('book_url', ''),
                        'rating': book_data.get('rating'),
                        'reviews_count': book_data.get('reviews_count', 0),
                        'genre': book_data.get('genre', 'other'),
                        'scraped_at': timezone.now(),
                    }
                )
                if created:
                    _process_book_pipeline(book)
            except Exception as e:
                logger.error(f"Error saving seed book '{title}': {e}")

    thread = threading.Thread(target=run_scrape)
    thread.daemon = True
    thread.start()

    return Response({
        'message': f'Automated Scraping launched in background. Live visiting books on toscrape.com... This will take a few seconds per book.',
    }, status=status.HTTP_202_ACCEPTED)


# ─────────────────────────────────────────────
# POST /api/books/ingest/   — Single URL/Title Ingest
# ─────────────────────────────────────────────
@api_view(['POST'])
def book_ingest(request):
    """
    Accepts a URL or Title, uses AI-assisted scraping (Selenium + Gemini),
    and saves the new book to the library.
    """
    input_str = request.data.get('input', '').strip()
    if not input_str:
        return Response({'error': 'Please provide a URL or Title.'}, status=status.HTTP_400_BAD_REQUEST)

    def run_smart_ingest():
        from .scraper.open_library import smart_ingest
        metadata = smart_ingest(input_str)
        if not metadata:
            logger.error("Smart Ingest failed to extract metadata.")
            return

        title = metadata.get('title', '').strip()
        try:
            book, created = Book.objects.get_or_create(
                title__iexact=title,
                defaults={
                    'title': title,
                    'author': metadata.get('author', ''),
                    'description': metadata.get('description', ''),
                    'cover_image': metadata.get('cover_image', ''),
                    'book_url': metadata.get('book_url', ''),
                    'rating': metadata.get('rating'),
                    'reviews_count': metadata.get('reviews_count', 0),
                    'genre': metadata.get('genre', 'other'),
                    'scraped_at': timezone.now(),
                }
            )
            # Run AI insights (summary/genre/sentiment) and Embeddings
            _process_book_pipeline(book)
        except Exception as e:
            logger.error(f"Error during Smart Ingest for '{input_str}': {e}")

    thread = threading.Thread(target=run_smart_ingest)
    thread.daemon = True
    thread.start()

    return Response({
        'message': f"Ingestion started for '{input_str}'. It will appear in your library shortly.",
    }, status=status.HTTP_202_ACCEPTED)


# ─────────────────────────────────────────────
# POST /api/books/ask/   — RAG Q&A
# ─────────────────────────────────────────────
@api_view(['POST'])
def book_ask(request):
    """
    RAG Q&A endpoint.
    Embeds the question, retrieves relevant chunks from ChromaDB,
    builds context, and queries Gemini for a grounded answer.
    """
    serializer = AskSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    question = serializer.validated_data['question']
    session_id = serializer.validated_data['session_id']
    book_id = serializer.validated_data.get('book_id')

    # Embed the question
    query_embedding = embed_single(question)

    # Retrieve relevant chunks
    results = similarity_search(query_embedding, n_results=6, book_id=book_id)

    context_chunks = (results.get('documents') or [[]])[0]
    meta_list = (results.get('metadatas') or [[]])[0]

    # Get source book info
    source_book_ids = list({m.get('book_id') for m in meta_list if m.get('book_id')})
    source_books_qs = Book.objects.filter(id__in=source_book_ids).values('id', 'title', 'author')
    source_books = list(source_books_qs)

    # Generate answer
    answer = generate_rag_answer(question, context_chunks, source_books)

    # Save to chat history
    ChatHistory.objects.create(
        session_id=session_id,
        question=question,
        answer=answer,
        sources=[{'id': b['id'], 'title': b['title']} for b in source_books],
    )

    return Response({
        'question': question,
        'answer': answer,
        'sources': source_books,
        'session_id': session_id,
    })


# ─────────────────────────────────────────────
# GET /api/chat-history/   — Chat history
# ─────────────────────────────────────────────
@api_view(['GET'])
def chat_history(request):
    """Returns chat history for a session."""
    session_id = request.query_params.get('session_id', 'default')
    history = ChatHistory.objects.filter(session_id=session_id)[:20]
    serializer = ChatHistorySerializer(history, many=True)
    return Response({'results': serializer.data})


# ─────────────────────────────────────────────
# GET /api/stats/   — Platform stats
# ─────────────────────────────────────────────
@api_view(['GET'])
def stats(request):
    """Returns quick platform statistics for the dashboard."""
    total = Book.objects.count()
    processed = Book.objects.filter(ai_processed=True).count()
    embedded = Book.objects.filter(is_embedded=True).count()
    genres = Book.objects.values('genre').distinct().count()

    try:
        from .rag.vector_store import get_collection_count
        vectors = get_collection_count()
    except Exception:
        vectors = 0

    return Response({
        'total_books': total,
        'ai_processed': processed,
        'embedded': embedded,
        'unique_genres': genres,
        'total_vectors': vectors,
    })
