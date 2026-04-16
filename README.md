# BookMind — AI-Powered Intelligence Platform

**BookMind** is a full-stack Next.js and Django platform built to extract, analyze, and communicate with literary metadata. It features an advanced asynchronous scraping engine, a dynamic Gemini-powered data formatter targeting `2.5-flash-lite`, and a cutting-edge **Retrieval-Augmented Generation (RAG)** pipeline powered by ChromaDB.

The platform relies on two decoupled servers:
1. **Frontend**: Next.js 15 App Router running a premium, hardware-accelerated "Cyber-Library" UI aesthetic.
2. **Backend**: Django & SQLite running automated Chromium headless scrapers and ChromaDB local vector embeddings.

---

## 🚀 Key Features

* **Smart URL Ingestion**: Paste any Goodreads URL and instantly utilize Gemini's zero-shot extraction to construct completely isolated JSON payloads holding generative details, genres, and sentiments.
* **Semantic Vector Q&A**: Every book ingested dynamically embeds its abstractions into a 3072-dimension vector space (ChromaDB), allowing you to interact natively with your library's combined dataset via the Neural Query Terminal.
* **Auto-Paced Batch Scraper**: Ingest up to 8 random books from catalogs sequentially inside the background thread, avoiding API throttling entirely with 6.0-second delay constraints.
* **State-of-the-Art Sub-Systems**: Fully decoupled frontend proxy architecture, micro-animation transitions, and live terminal loading bars tracking background threads dynamically.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js (TypeScript), Tailwind CSS, Lucide-React, custom Glassmorphism overlays.
* **Backend**: Python 3.12, Django, Local ChromaDB, BeautifulSoup4 (Scraping).
* **AI Provider**: Google GenAI `gemini-2.5-flash-lite`
* **Databases**: SQLite (Standard Web Metadata), Local Disk Vector DB (Embeddings).

---

## 💻 Local Setup & Execution
You must run both the backend and frontend simultaneously.

### 1. Python Environment & Backend Server
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**CRITICAL SECRETS:** Insert your API key into `backend/.env`.
```env
GEMINI_API_KEY="your-google-ai-key-here"
```

Migrate and launch the Django server:
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver 8000
```

### 2. Next.js Frontend Server
In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```

The platform will be active at `http://localhost:3000`.

