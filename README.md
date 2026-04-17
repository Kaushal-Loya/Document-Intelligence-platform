# BookMind — AI-Powered Intelligence Platform

**BookMind** is a full-stack Next.js and Django platform built to extract, analyze, and communicate with literary metadata. It features an advanced asynchronous scraping engine, a dynamic Gemini-powered data formatter targeting `2.5-flash-lite`, and a cutting-edge **Retrieval-Augmented Generation (RAG)** pipeline powered by ChromaDB.

The platform relies on two decoupled servers:
1. **Frontend**: Next.js 15 App Router running a premium, hardware-accelerated "Cyber-Library" UI aesthetic.
2. **Backend**: Django & SQLite running automated Chromium headless scrapers and ChromaDB local vector embeddings.

---

## 📸 Platform Preview

Below are the internal state-archives of the BookMind interface.

![Nexus Dashboard](/frontend/public/Screenshot%202026-04-17%20160806.png)
*Figure 1: The Core Library Nexus showing dynamic stats and recent ingestions.*

![Neural Query](/frontend/public/Screenshot%202026-04-17%20160849.png)
*Figure 2: The Neural Query Terminal executing RAG-based literary analysis.*

![Insight Extraction](/frontend/public/Screenshot%202026-04-17%20161035.png)
*Figure 3: Smart Metadata Isolation and deep sentiment mapping for a specific artifact.*

![Batch Ingestion](/frontend/public/Screenshot%202026-04-17%20163910.png)
*Figure 4: The Batch AI Ingestion engine in its active state.*

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
* **AI Provider**: Google GenAI `gemini-2.0-flash`
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

---

## 📡 API Documentation

The BookMind backend exposes a variety of RESTful endpoints. **For full technical specifications, schemas, and examples, see the [Full API Guide](DOCS/API.md).**

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/books/` | `GET` | List all books with searching and genre filtering. |
| `/api/books/ingest/` | `POST` | Smart URL/Title ingestion via Gemini. |
| `/api/books/scrape/` | `POST` | Batch scrape and vectorize books from catalog. |
| `/api/books/ask/` | `POST` | RAG Answer generation based on loaded library. |
| `/api/stats/` | `GET` | Retrieve platform-wide processing statistics. |

---

## 🧠 Sample Neural Queries (RAG)

Here are samples of literary intelligence processed by the platform:

**Question**: *Compare the core themes of the books currently in the library.*
**Answer**: *Based on the current dataset, "The Demon of Unrest" explores themes of historical tension and political turmoil, while "The Boys from Biloxi" focuses on legal battles and corruption in the South. Both narratives emphasize the struggle for justice in volatile environments.*

**Question**: *What is the emotional tone of the collection?*
**Answer**: *The collection leans towards a serious and suspenseful tone. "The Boys from Biloxi" is identified as having a 'neutral-to-serious' sentiment in its legal drama, while the overall library sentiment average tracks at 0.15 (slightly positive) due to the resolution-focused nature of the narratives.*

---

## 🧪 Samples for Testing
You can use the following URLs to test the **Smart Ingest** engine:
*   `https://www.goodreads.com/book/show/61065355-the-boys-from-biloxi`
*   `https://www.goodreads.com/book/show/195608683-the-demon-of-unrest`
*   `https://www.goodreads.com/book/show/2493.The_Stranger`

