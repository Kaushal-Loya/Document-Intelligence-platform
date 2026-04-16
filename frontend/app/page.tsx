'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchBooks, fetchStats, deleteBook, triggerScrape, ingestBook, Book, Stats } from '@/lib/api';
import BookCard from '@/components/BookCard';
import { Search, RefreshCw, Plus, BookOpen, Brain, Layers, Tag, Loader2, X, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const GENRES = ['', 'fiction', 'non-fiction', 'sci-fi', 'mystery', 'fantasy', 'thriller', 'romance', 'science', 'history', 'biography', 'philosophy', 'self-help', 'classics', 'other'];

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: any; color: string }) {
  return (
    <div className={`glass rounded-xl p-4 border ${color} flex items-center gap-3`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color.replace('border-', 'bg-').replace('/30', '/20')}`}>
        <Icon size={18} className={color.replace('border-', 'text-').replace('/30', '')} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl overflow-hidden border border-indigo-500/10">
      <div className="h-52 shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-4 shimmer rounded w-3/4" />
        <div className="h-3 shimmer rounded w-1/2" />
        <div className="h-3 shimmer rounded w-1/3" />
      </div>
    </div>
  );
}

interface DeleteModal { id: number; title: string; }

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [sort, setSort] = useState('-created_at');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteModal, setDeleteModal] = useState<DeleteModal | null>(null);
  const [scraping, setScraping] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState(0);
  const [scrapeMsg, setScrapeMsg] = useState('');
  const [ingestInput, setIngestInput] = useState('');
  const [ingesting, setIngesting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBooks({ page, search: debouncedSearch, genre, sort });
      setBooks(data.results);
      setTotalCount(data.count);
      setTotalPages(Math.ceil(data.count / 12));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, genre, sort]);

  const loadStats = async () => {
    try {
      const s = await fetchStats();
      setStats(s);
    } catch {}
  };

  useEffect(() => { loadBooks(); }, [loadBooks]);
  useEffect(() => { loadStats(); }, []);

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleteLoading(true);
    try {
      await deleteBook(deleteModal.id);
      setBooks((prev) => prev.filter((b) => b.id !== deleteModal.id));
      setTotalCount((c) => c - 1);
      
      // Perform a clean soft refresh of the dashboard
      loadBooks();
      loadStats();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteLoading(false);
      setDeleteModal(null);
    }
  };

  const handleScrape = async () => {
    setScraping(true);
    setScrapeMsg('');
    setScrapeProgress(0);
    try {
      const res = await triggerScrape(8);
      
      let pollCount = 0;
      const pollTimer = setInterval(() => {
        loadBooks();
        loadStats();
        pollCount++;
        setScrapeProgress(pollCount);
        if (pollCount >= 16) { // 16 * 8 = 128 seconds
          clearInterval(pollTimer);
          setScraping(false);
          setScrapeMsg('');
        }
      }, 8000);
    } catch {
      setScraping(false);
      setScrapeMsg('Failed to start scraping.');
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestInput.trim()) return;
    setIngesting(true);
    setScrapeMsg('');
    try {
      const res = await ingestBook(ingestInput.trim());
      setScrapeMsg(res.message);
      setIngestInput('');
      
      let pollCount = 0;
      const pollTimer = setInterval(() => {
        loadBooks();
        loadStats();
        pollCount++;
        if (pollCount >= 4) { // 4 * 8 = 32 seconds max
          clearInterval(pollTimer);
          setIngesting(false);
          setScrapeMsg('');
        }
      }, 8000);
    } catch {
      setIngesting(false);
      setScrapeMsg('Failed to ingest book.');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden px-4 pt-12 pb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/50 via-gray-950 to-purple-950/30 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            AI-Powered Book Intelligence Platform
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold">
            <span className="gradient-text">BookMind</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Discover books with AI-generated insights. Ask questions, explore genres, and find your next read.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 fade-in">
            <StatCard label="Total Books" value={stats.total_books} icon={BookOpen} color="border-indigo-500/30" />
            <StatCard label="AI Processed" value={stats.ai_processed} icon={Brain} color="border-purple-500/30" />
            <StatCard label="Genres" value={stats.unique_genres} icon={Tag} color="border-amber-500/30" />
          </div>
        )}

        {/* Smart Ingest - New Feature */}
        <div className="glass rounded-2xl p-6 border border-indigo-500/20 bg-indigo-500/5 fade-in">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="hidden sm:flex w-12 h-12 rounded-xl bg-indigo-600/20 items-center justify-center text-indigo-400 shrink-0">
              <Brain size={24} />
            </div>
            <div className="flex-1 space-y-1 text-center md:text-left">
              <h3 className="text-lg font-semibold text-white">Smart Book Ingest</h3>
              <p className="text-sm text-gray-400">Paste any Goodreads URL or Book Title to add it instantly using AI extraction.</p>
            </div>
            <form onSubmit={handleIngest} className="w-full md:w-auto flex flex-1 gap-2 max-w-xl">
              <div className="relative flex-1">
                <Plus size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="e.g. https://www.goodreads.com/book/show/..."
                  value={ingestInput}
                  onChange={(e) => setIngestInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-950/50 border border-gray-700/60 rounded-xl text-sm focus:outline-none focus:border-indigo-500/60 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={ingesting || !ingestInput.trim()}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap"
              >
                {ingesting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Add Book
              </button>
            </form>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search books or authors..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900/80 border border-gray-700/60 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Genre filter */}
          <select
            value={genre}
            onChange={(e) => { setGenre(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-gray-900/80 border border-gray-700/60 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-indigo-500/60 transition-all min-w-[140px]"
          >
            {GENRES.map((g) => (
              <option key={g} value={g}>{g ? g.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All Genres'}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-gray-900/80 border border-gray-700/60 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-indigo-500/60 transition-all min-w-[140px]"
          >
            <option value="-created_at">Newest First</option>
            <option value="created_at">Oldest First</option>
            <option value="-rating">Highest Rated</option>
            <option value="title">Title A-Z</option>
            <option value="-title">Title Z-A</option>
          </select>

          {/* Scrape button */}
          <button
            onClick={handleScrape}
            disabled={scraping}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl text-sm font-medium text-white transition-all"
          >
            {scraping ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            {scraping ? 'Scraping...' : 'Scrape Books'}
          </button>
        </div>

        {/* Scrape status */}
        {scrapeMsg && (
          <div className="p-3 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm flex items-center gap-2">
            <Brain size={14} />
            {scrapeMsg}
          </div>
        )}

        {/* Dynamic AI Scrape Loader */}
        {scraping && (
          <div className="glass rounded-2xl p-8 border border-indigo-500/30 flex flex-col items-center justify-center space-y-6 bg-indigo-900/10 mb-8 fade-in">
            <Loader2 size={40} className="text-indigo-400 animate-spin" />
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-white">AI Data Ingestion Active</h3>
              <p className="text-indigo-300 font-medium">
                {(() => {
                  if (scrapeProgress < 1) return 'Initializing Headless Web Scraper...';
                  if (scrapeProgress < 2) return 'Fetching Random Books from Catalogue...';
                  if (scrapeProgress < 4) return 'Passing Book 1 to Gemini AI Engine...';
                  if (scrapeProgress < 6) return 'Embedding Vector Chunks into ChromaDB...';
                  if (scrapeProgress < 8) return 'Processing Book 2 via JSON Native Abstraction...';
                  if (scrapeProgress < 13) return 'Processing remaining books dynamically...';
                  return 'Finalizing database sync...';
                })()}
              </p>
              <p className="text-xs text-gray-400">Respecting strict AI API safety quotas. Books will auto-populate below as they finish.</p>
            </div>
            <div className="w-full max-w-md h-2 bg-gray-800/80 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out" 
                style={{ width: `${Math.min(100, Math.round((scrapeProgress / 16) * 100))}%` }} 
              />
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {totalCount > 0 ? `Showing ${books.length} of ${totalCount} books` : loading ? '' : 'No books found'}
          </p>
        </div>

        {/* Book grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : books.map((book) => (
                <BookCard key={book.id} book={book} onDelete={(id, title) => setDeleteModal({ id, title })} />
              ))}
        </div>

        {/* Empty state */}
        {!loading && books.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="w-20 h-20 rounded-full bg-indigo-600/20 flex items-center justify-center mx-auto">
              <BookOpen size={32} className="text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300">No books yet</h3>
            <p className="text-gray-500">Click "Scrape Books" to populate the library from Open Library.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-700/50 text-gray-300 hover:bg-gray-700/60 disabled:opacity-40 transition-all text-sm"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-700/50 text-gray-300 hover:bg-gray-700/60 disabled:opacity-40 transition-all text-sm"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass rounded-2xl p-6 max-w-sm w-full border border-red-500/30 space-y-4 fade-in">
            <h3 className="text-lg font-semibold text-gray-100">Delete Book</h3>
            <p className="text-sm text-gray-400">
              Are you sure you want to delete <span className="text-gray-200 font-medium">"{deleteModal.title}"</span>?
              This will also remove its embeddings from the vector store.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-gray-800 border border-gray-700/60 text-sm text-gray-300 hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-sm text-white font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deleteLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
