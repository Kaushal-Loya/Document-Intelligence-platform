'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
    book.genre.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Book Library</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          {showAddForm ? 'Cancel' : 'Add Book'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Add New Book</h2>
          <form onSubmit={handleAddBook}>
            <input
              type="url"
              placeholder="Enter book URL (e.g., Goodreads link)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 mb-4"
              required
            />
            <button
              type="submit"
              disabled={addingBook}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {addingBook ? 'Processing...' : 'Add Book'}
            </button>
          </form>
        </div>
      )}

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search books..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-lg px-4 py-2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.map((book) => (
          <div key={book.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">
              <Link href={`/book/${book.id}`} className="text-primary-600 hover:underline">
                {book.title}
              </Link>
            </h3>
            <p className="text-gray-600 mb-2">by {book.author}</p>
            
            <div className="flex items-center mb-3">
              <span className="text-yellow-500 mr-1">★</span>
              <span className="text-sm text-gray-700">
                {book.rating?.toFixed(1) || 'N/A'} ({book.reviews_count} reviews)
              </span>
            </div>

            {book.genre && (
              <span className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm mb-3">
                {book.genre}
              </span>
            )}

            <p className="text-gray-500 text-sm line-clamp-3 mb-4">
              {book.description || 'No description available.'}
            </p>

            <div className="flex gap-2">
              <Link
                href={`/book/${book.id}`}
                className="flex-1 text-center bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200"
              >
                View Details
              </Link>
              <Link
                href={`/ask?book=${book.id}`}
                className="flex-1 text-center bg-primary-100 text-primary-700 px-3 py-2 rounded hover:bg-primary-200"
              >
                Ask about this
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredBooks.length === 0 && !loading && (
        <div className="text-center text-gray-500 py-12">
          No books found. Add your first book to get started!
        </div>
      )}
    </div>
  );
}
