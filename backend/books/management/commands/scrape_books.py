"""
Django management command: python manage.py scrape_books
Scrapes books from Open Library and saves them with AI insights + embeddings.
"""
import logging
from django.core.management.base import BaseCommand
from django.utils import timezone
from books.models import Book, BookChunk
from books.scraper.open_library import run_scraper
from books.rag.embeddings import process_book_for_embedding
from books.rag.vector_store import add_chunks
from books.rag.llm import generate_all_insights

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Scrape books from Open Library and process them with AI insights + embeddings'

    def add_arguments(self, parser):
        parser.add_argument(
            '--max-per-subject', type=int, default=8,
            help='Max books to scrape per subject (default: 8)'
        )
        parser.add_argument(
            '--skip-ai', action='store_true', default=False,
            help='Skip AI insight generation (faster, for testing)'
        )
        parser.add_argument(
            '--skip-embeddings', action='store_true', default=False,
            help='Skip embedding generation'
        )

    def handle(self, *args, **options):
        max_per_subject = options['max_per_subject']
        skip_ai = options['skip_ai']
        skip_embeddings = options['skip_embeddings']

        self.stdout.write(self.style.SUCCESS(
            f'\nStarting book scraper (max {max_per_subject} per subject)...\n'
        ))

        # Step 1: Scrape
        raw_books = run_scraper(max_per_subject=max_per_subject)
        self.stdout.write(f'Scraped {len(raw_books)} books from Open Library\n')

        saved = 0
        failed = 0

        for book_data in raw_books:
            try:
                self._process_book(book_data, skip_ai, skip_embeddings)
                saved += 1
                self.stdout.write(f'  ✓ Saved: {book_data.get("title", "?")}')
            except Exception as e:
                failed += 1
                self.stdout.write(
                    self.style.WARNING(f'  ✗ Failed: {book_data.get("title", "?")} — {e}')
                )

        self.stdout.write(self.style.SUCCESS(
            f'\nDone! Saved: {saved} | Failed: {failed}\n'
        ))

    def _process_book(self, data: dict, skip_ai: bool, skip_embeddings: bool):
        """Creates or updates a Book and its embeddings."""
        # Skip duplicates by title (case-insensitive)
        title = data.get('title', '').strip()
        if not title:
            return

        book, created = Book.objects.get_or_create(
            title__iexact=title,
            defaults={
                'title': title,
                'author': data.get('author', ''),
                'description': data.get('description', ''),
                'cover_image': data.get('cover_image', ''),
                'book_url': data.get('book_url', ''),
                'rating': data.get('rating'),
                'reviews_count': data.get('reviews_count', 0),
                'genre': data.get('genre', 'other'),
                'scraped_at': timezone.now(),
            }
        )

        if not created:
            # Update description/cover if we got better data
            if data.get('description') and not book.description:
                book.description = data['description']
            if data.get('cover_image') and not book.cover_image:
                book.cover_image = data['cover_image']

        # Step 2: AI insights
        if not skip_ai and not book.ai_processed:
            self.stdout.write(f'    Generating AI insights...')
            insights = generate_all_insights(book)
            book.summary = insights.get('summary', '')
            book.genre = insights.get('genre', book.genre or 'other')
            book.sentiment = insights.get('sentiment', 'neutral')
            book.sentiment_score = insights.get('sentiment_score', 0.0)
            book.ai_processed = True

        # Step 3: Embeddings
        if not skip_embeddings and not book.is_embedded:
            self.stdout.write(f'    Generating embeddings...')
            chunks, embeddings = process_book_for_embedding(book)
            embedding_ids = add_chunks(book.id, chunks, embeddings)

            # Save chunks to DB
            BookChunk.objects.filter(book=book).delete()
            for i, (chunk, emb_id) in enumerate(zip(chunks, embedding_ids)):
                BookChunk.objects.create(
                    book=book,
                    chunk_text=chunk,
                    chunk_index=i,
                    embedding_id=emb_id,
                )
            book.is_embedded = True

        book.save()
