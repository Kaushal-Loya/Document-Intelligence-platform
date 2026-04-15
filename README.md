# Document Intelligence Platform

AI-Powered Book Insight and Q&A System with RAG (Retrieval Augmented Generation).

## Overview

A full-stack web application that:
- Scrapes book data from the web using Selenium
- Generates AI insights (summary, genre, sentiment)
- Stores books in MySQL with vector embeddings in ChromaDB
- Answers questions using RAG pipeline with source citations
- Provides a modern React frontend with Tailwind CSS

## Features

### Backend (Django REST Framework)
- **GET /api/books** - List all books with search/filter
- **GET /api/books/<id>** - Book details with AI insights
- **GET /api/books/<id>/recommendations** - AI-based book recommendations
- **POST /api/books** - Scrape and add new book
- **POST /api/ask** - RAG-powered Q&A endpoint

### AI Insights
- **Summary**: AI-generated book summaries
- **Genre Classification**: Automatic genre prediction
- **Sentiment Analysis**: Review sentiment detection
- **Recommendations**: "If you like X, you'll like Y"

### RAG Pipeline
- Smart text chunking (paragraph/sentence/window strategies)
- Sentence Transformers for embeddings
- ChromaDB for vector storage and similarity search
- Local LLM support via LM Studio
- Response caching for repeated queries
- Source citations in answers

### Frontend (Next.js + Tailwind CSS)
- **Dashboard**: Browse all books, add new books via URL
- **Book Detail**: View AI insights, ratings, similar books
- **Q&A Interface**: Chat with books using natural language

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Django REST Framework, Python 3.11+ |
| Database | MySQL 8.0 (metadata), ChromaDB (vectors) |
| AI/Embeddings | sentence-transformers, ChromaDB |
| LLM | LM Studio (local) or OpenAI API |
| Automation | Selenium, BeautifulSoup |
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS |
| Async Tasks | Celery + Redis (optional) |

## Setup Instructions

### Prerequisites
- Python 3.11+
- MySQL 8.0+
- Node.js 18+
- Chrome/Chromium (for Selenium)
- LM Studio (optional, for local LLM)

### Backend Setup

1. **Create virtual environment:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Create database:**
```sql
CREATE DATABASE book_insight CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. **Run migrations:**
```bash
python manage.py migrate
```

6. **Start server:**
```bash
python manage.py runserver
```

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Open:** http://localhost:3000

### LM Studio Setup (for local LLM)

1. Download and install LM Studio: https://lmstudio.ai/
2. Download a model (e.g., Llama 2, Mistral)
3. Start the local server on port 1234
4. The backend will automatically use `http://localhost:1234/v1`

## API Documentation

### Books API

#### List Books
```http
GET /api/books/
GET /api/books/?search=pride
GET /api/books/?genre=Fiction
```

**Response:**
```json
{
  "count": 42,
  "results": [
    {
      "id": 1,
      "title": "Pride and Prejudice",
      "author": "Jane Austen",
      "rating": 4.28,
      "reviews_count": 3456789,
      "description": "...",
      "book_url": "https://...",
      "genre": "Romance",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Book Details
```http
GET /api/books/1/
```

**Response:**
```json
{
  "id": 1,
  "title": "Pride and Prejudice",
  "author": "Jane Austen",
  "rating": 4.28,
  "reviews_count": 3456789,
  "description": "...",
  "book_url": "https://...",
  "summary": "A romantic novel about Elizabeth Bennet...",
  "genre": "Romance",
  "sentiment": "positive",
  "is_processed": true,
  "chunks_count": 12,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:35:00Z"
}
```

#### Add Book
```http
POST /api/books/
Content-Type: application/json

{
  "book_url": "https://www.goodreads.com/book/show/1885.Pride_and_Prejudice"
}
```

**Response:**
```json
{
  "message": "Book processed successfully",
  "book": { ... },
  "chunks_created": 12,
  "insights_generated": ["summary", "genre"]
}
```

#### Get Recommendations
```http
GET /api/books/1/recommendations/
```

**Response:**
```json
{
  "book_id": 1,
  "book_title": "Pride and Prejudice",
  "recommendations": [
    {
      "id": 2,
      "title": "Emma",
      "author": "Jane Austen",
      "genre": "Romance",
      "rating": 4.0,
      "reasoning": "Same author and similar romantic themes",
      "similarity_score": 2.5
    }
  ]
}
```

### Q&A API

#### Ask Question
```http
POST /api/ask/
Content-Type: application/json

{
  "question": "What is the main theme of Pride and Prejudice?",
  "book_id": 1,
  "session_id": "abc123"
}
```

**Response:**
```json
{
  "question": "What is the main theme of Pride and Prejudice?",
  "answer": "The main themes include love, marriage, and social class... [Source 1]",
  "sources": [
    {
      "book_id": 1,
      "chunk_index": 3,
      "text": "The novel explores themes of love...",
      "similarity": 0.89
    }
  ],
  "cached": false,
  "book": {
    "id": 1,
    "title": "Pride and Prejudice"
  },
  "session_id": "abc123"
}
```

#### Get Chat History
```http
GET /api/chat/abc123/history/
```

## Sample Questions

1. "What is the main theme of Pride and Prejudice?"
2. "Who are the main characters in the book?"
3. "What is the historical context of this novel?"
4. "Compare the writing style of Jane Austen to this author"
5. "What do reviewers say about this book?"

## Project Structure

```
book-insight-platform/
├── backend/
│   ├── api/
│   │   ├── models.py          # Book, BookChunk, QueryCache, ChatHistory
│   │   ├── views.py           # API endpoints
│   │   ├── serializers.py     # DRF serializers
│   │   ├── urls.py            # URL routing
│   │   └── admin.py           # Django admin
│   ├── document_processor/
│   │   ├── scraper.py         # Selenium web scraper
│   │   ├── chunker.py         # Text chunking strategies
│   │   ├── embeddings.py      # ChromaDB + embeddings
│   │   ├── insights.py        # AI insight generation
│   │   └── rag_pipeline.py    # RAG implementation
│   ├── book_insight/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Dashboard
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css
│   │   ├── ask/page.tsx       # Q&A interface
│   │   └── book/[id]/page.tsx # Book detail
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   └── tailwind.config.ts
└── README.md
```

## Screenshots

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Book Detail
![Book Detail](screenshots/book-detail.png)

### Q&A Interface
![Q&A Interface](screenshots/qna.png)

## Bonus Features Implemented

- ✅ **Caching**: AI responses cached to avoid repeated LLM calls
- ✅ **Embedding-based similarity**: Vector search using ChromaDB
- ✅ **Smart chunking**: Multiple strategies (paragraph, sentence, window)
- ✅ **Loading states**: UX polish with spinners and disabled states
- ✅ **Chat history**: Conversations stored and retrievable
- ✅ **Source citations**: RAG answers cite their sources
- ✅ **Local LLM support**: Works with LM Studio (no API keys needed)

## Testing

### Add a Test Book
```bash
curl -X POST http://localhost:8000/api/books/ \
  -H "Content-Type: application/json" \
  -d '{"book_url": "https://www.goodreads.com/book/show/1885.Pride_and_Prejudice"}'
```

### Test RAG Query
```bash
curl -X POST http://localhost:8000/api/ask/ \
  -H "Content-Type: application/json" \
  -d '{"question": "What is this book about?", "book_id": 1}'
```

## Troubleshooting

### Selenium Issues
- Make sure Chrome/Chromium is installed
- Download matching ChromeDriver if needed
- Try running Chrome in headless mode (default)

### LM Studio Connection
- Verify LM Studio is running on port 1234
- Check that a model is loaded
- Test: `curl http://localhost:1234/v1/models`

### ChromaDB Issues
- Ensure write permissions for `./chroma_db` directory
- Try deleting and recreating the chroma_db folder if corrupted

### CORS Errors
- Backend CORS is configured for `localhost:3000`
- If using different ports, update `CORS_ALLOWED_ORIGINS` in settings.py

## License

MIT License

## Acknowledgments

- [LM Studio](https://lmstudio.ai/) for local LLM hosting
- [ChromaDB](https://docs.trychroma.com/) for vector storage
- [Sentence Transformers](https://www.sbert.net/) for embeddings
- [Django REST Framework](https://www.django-rest-framework.org/) for API
