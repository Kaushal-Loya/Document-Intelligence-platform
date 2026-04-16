import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Types ──────────────────────────────────────────────────────────────
export interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  cover_image: string;
  book_url: string;
  rating: number | null;
  reviews_count: number;
  genre: string;
  summary: string;
  sentiment: string;
  sentiment_score: number | null;
  ai_processed: boolean;
  is_embedded: boolean;
  created_at: string;
}

export interface PaginatedBooks {
  count: number;
  next: string | null;
  previous: string | null;
  results: Book[];
}

export interface AskResponse {
  question: string;
  answer: string;
  sources: Array<{ id: number; title: string; author?: string }>;
  session_id: string;
}

export interface ChatMessage {
  id: number;
  session_id: string;
  question: string;
  answer: string;
  sources: Array<{ id: number; title: string }>;
  created_at: string;
}

export interface Stats {
  total_books: number;
  ai_processed: number;
  embedded: number;
  unique_genres: number;
  total_vectors: number;
}

// ── API Functions ───────────────────────────────────────────────────────
export const fetchBooks = async (params: {
  page?: number;
  search?: string;
  genre?: string;
  sort?: string;
}): Promise<PaginatedBooks> => {
  const res = await api.get('/books/', { params });
  return res.data;
};

export const fetchBook = async (id: number): Promise<Book> => {
  const res = await api.get(`/books/${id}/`);
  return res.data;
};

export const fetchRecommendations = async (id: number): Promise<{ results: Book[] }> => {
  const res = await api.get(`/books/${id}/recommend/`);
  return res.data;
};

export const deleteBook = async (id: number): Promise<{ message: string }> => {
  const res = await api.delete(`/books/${id}/delete/`);
  return res.data;
};

export const uploadBook = async (data: Partial<Book>): Promise<{ message: string; book: Book }> => {
  const res = await api.post('/books/upload/', data);
  return res.data;
};

export const triggerScrape = async (maxPerSubject = 5): Promise<{ message: string }> => {
  const res = await api.post('/books/scrape/', { max_per_subject: maxPerSubject });
  return res.data;
};

export const ingestBook = async (input: string): Promise<{ message: string }> => {
  const res = await api.post('/books/ingest/', { input });
  return res.data;
};

export const askQuestion = async (data: {
  question: string;
  session_id?: string;
  book_id?: number | null;
}): Promise<AskResponse> => {
  const res = await api.post('/books/ask/', data);
  return res.data;
};

export const fetchChatHistory = async (session_id: string): Promise<{ results: ChatMessage[] }> => {
  const res = await api.get('/chat-history/', { params: { session_id } });
  return res.data;
};

export const fetchStats = async (): Promise<Stats> => {
  const res = await api.get('/stats/');
  return res.data;
};

export default api;
