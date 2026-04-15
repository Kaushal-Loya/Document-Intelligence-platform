'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  BookOpen, 
  Star, 
  ExternalLink, 
  MessageSquare, 
  Loader2, 
  X,
  Filter,
  ArrowRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Book {
  id: number;
  title: string;
  author: string;
  rating: number | null;
  reviews_count: number;
  description: string;
  book_url: string;
  genre: string;
  created_at: string;
}

export default function Dashboard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [addingBook, setAddingBook] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/books/');
      const data = await response.json();
      setBooks(data.results || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;

    setAddingBook(true);
    try {
      const response = await fetch('/api/books/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_url: newUrl }),
      });

      if (response.ok) {
        setNewUrl('');
        setShowAddForm(false);
        fetchBooks();
      } else {
        alert('Failed to add book. Please check the URL.');
      }
    } catch (error) {
      console.error('Error adding book:', error);
      alert('Error adding book.');
    } finally {
      setAddingBook(false);
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(search.toLowerCase()) ||
    book.author.toLowerCase().includes(search.toLowerCase()) ||
    (book.genre && book.genre.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      {/* Hero / Header Section */}
      <section className="text-center space-y-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-medium border border-primary-200"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
          </span>
          Next-Gen Document Intelligence
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900"
        >
          Your AI-Powered <span className="text-gradient">Book Intelligence</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-slate-500 max-w-2xl mx-auto text-lg"
        >
          Scrape books, generate instant AI insights, and chat with your documents using our advanced RAG pipeline.
        </motion.p>
      </section>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-20 z-40 bg-background/95 backdrop-blur-sm py-4 border-b">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="Search titles, authors, genres..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 text-sm font-medium"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Cancel' : 'Add Book'}
          </button>
        </div>
      </div>

      {/* Add Form Overlay */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
                  <ExternalLink className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Scrape New Document</h2>
                  <p className="text-slate-500 text-sm">Paste a Goodreads or bookstore URL to parse metadata and content.</p>
                </div>
              </div>
              
              <form onSubmit={handleAddBook} className="flex flex-col md:flex-row gap-4">
                <input
                  type="url"
                  placeholder="https://www.goodreads.com/book/show/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="flex-1 border rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  required
                />
                <button
                  type="submit"
                  disabled={addingBook}
                  className="bg-primary-600 text-white px-8 py-3 rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold shadow-lg shadow-primary-500/20 transition-all active:scale-95"
                >
                  {addingBook ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  {addingBook ? 'Processing Content...' : 'Start Extraction'}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Books Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-20">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse space-y-4">
              <div className="h-64 bg-slate-100 rounded-3xl" />
              <div className="h-6 bg-slate-100 rounded w-2/3" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence>
            {filteredBooks.map((book, index) => (
              <motion.div
                key={book.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                <div className="glass-card rounded-[2rem] p-8 h-full flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-primary-100 rounded-2xl text-primary-600">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    {book.rating && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold ring-1 ring-yellow-200">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {book.rating.toFixed(1)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-3">
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900 group-hover:text-primary-600 transition-colors">
                      <Link href={`/book/${book.id}`}>{book.title}</Link>
                    </h3>
                    <p className="text-slate-500 font-medium pb-2">by {book.author}</p>
                    
                    {book.genre && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border">
                        {book.genre}
                      </span>
                    )}

                    <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed">
                      {book.description || 'Context extraction pending for this book description.'}
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t flex items-center justify-between gap-4">
                    <Link
                      href={`/book/${book.id}`}
                      className="text-sm font-bold flex items-center gap-1.5 text-slate-400 hover:text-primary-600 transition-colors"
                    >
                      Details
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    
                    <Link
                      href={`/ask?book=${book.id}`}
                      className="bg-primary-50 text-primary-600 px-6 py-2.5 rounded-2xl text-sm font-bold hover:bg-primary-600 hover:text-white transition-all flex items-center gap-2 group/btn shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Ask AI
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {filteredBooks.length === 0 && !loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 space-y-6"
        >
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <BookOpen className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">No matches found</h3>
            <p className="text-slate-400">Try adjusting your search or add a new book link.</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
