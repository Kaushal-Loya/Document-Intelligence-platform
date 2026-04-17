# BookMind API Documentation

Base URL: `http://localhost:8000/api/`

All endpoints return JSON responses. Authentication is not required for this iteration.

---

## 📚 Book Management

### 1. List All Books
`GET /books/`

Returns a paginated list of books.

**Query Parameters:**
- `search`: (Optional) Search by title or author.
- `genre`: (Optional) Filter by genre.
- `sort`: (Optional) Sort field (e.g., `-created_at`, `title`, `-rating`).
- `page`: (Optional) Page number for pagination.

**Response (Example):**
```json
{
    "count": 42,
    "next": "http://localhost:8000/api/books/?page=2",
    "previous": null,
    "results": [
        {
            "id": 1,
            "title": "The Boys from Biloxi",
            "author": "John Grisham",
            "rating": "4.23",
            "genre": "thriller",
            "ai_processed": true
        }
    ]
}
```

### 2. Book Detail
`GET /books/<id>/`

Returns full details for a single book, including its semantic chunks.

### 3. Delete Book
`DELETE /books/<id>/destroy/`

Deletes a book and removes its associated vectors from ChromaDB.

---

## 🤖 Neural & AI Endpoints

### 4. Smart Ingest
`POST /books/ingest/`

Accepts a URL or Title and triggers AI-assisted metadata extraction.

**Request Body:**
```json
{
    "input": "https://www.goodreads.com/book/show/61065355-the-boys-from-biloxi"
}
```

**Response:**
```json
{
    "message": "Ingestion started for '...'. It will appear in your library shortly."
}
```

### 5. Neural Query (RAG)
`POST /books/ask/`

Ask a question based on your library content.

**Request Body:**
```json
{
    "question": "What are the common themes in my mystery books?",
    "session_id": "optional-id",
    "book_id": null
}
```

**Response:**
```json
{
    "question": "...",
    "answer": "Based on '[Book A]' and '[Book B]', the themes include...",
    "sources": [{"id": 1, "title": "Book A"}],
    "session_id": "..."
}
```

### 6. Batch Scrape
`POST /books/scrape/`

Triggers a background batch scrape from the seed catalog.

---

## 📊 Analytics

### 7. Platform Stats
`GET /stats/`

Returns global statistics about processing and vectorization.

**Response:**
```json
{
    "total_books": 10,
    "ai_processed": 8,
    "embedded": 8,
    "unique_genres": 4,
    "total_vectors": 320
}
```
