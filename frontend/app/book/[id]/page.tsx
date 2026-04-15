'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Book {
  id: number;
  title: string;
  author: string;
  rating: number | null;
  reviews_count: number;
  description: string;
  book_url: string;
  summary: string;
  genre: string;
  sentiment: string;
  is_processed: boolean;
  chunks_count: number;
  created_at: string;
  updated_at: string;
}

interface Recommendation {
  id: number;
  title: string;
  author: string;
  genre: string;
  rating: number;
  reasoning: string;
  similarity_score: number;
}

export default function BookDetail() {
  const params = useParams();
  const id = params.id as string;

  const [book, setBook] = useState<Book | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBook();
      fetchRecommendations();
    }
  }, [id]);

  const fetchBook = async () => {
    try {
      const response = await fetch(`/api/books/${id}/`);
      const data = await response.json();
      setBook(data);
    } catch (error) {
      console.error('Error fetching book:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`/api/books/${id}/recommendations/`);
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Book not found.</p>
        <Link href="/" className="text-primary-600 hover:underline mt-4 inline-block">
          ← Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/" className="text-primary-600 hover:underline mb-4 inline-block">
        ← Back to Library
      </Link>

      <div className="bg-white rounded-lg shadow p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{book.title}</h1>
        <p className="text-xl text-gray-600 mb-6">by {book.author}</p>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center">
            <span className="text-yellow-500 text-2xl mr-2">★</span>
            <span className="text-lg">
              {book.rating?.toFixed(1) || 'N/A'} ({book.reviews_count} reviews)
            </span>
          </div>

          {book.genre && (
            <span className="bg-primary-100 text-primary-700 px-4 py-2 rounded-full">
              {book.genre}
            </span>
          )}

          {book.sentiment && (
            <span className={`px-4 py-2 rounded-full ${
              book.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
              book.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              Sentiment: {book.sentiment}
            </span>
          )}

          <span className={`px-4 py-2 rounded-full text-sm ${
            book.is_processed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {book.is_processed ? 'Processed' : 'Processing'}
          </span>
        </div>

        {book.summary && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">AI Summary</h2>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{book.summary}</p>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{book.description || 'No description available.'}</p>
        </div>

        <div className="flex gap-4">
          <Link
            href={`/ask?book=${book.id}`}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
          >
            Ask about this book
          </Link>
          {book.book_url && (
            <a
              href={book.book_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200"
            >
              View Source
            </a>
          )}
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Books You Might Like</h2>
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">
                      <Link href={`/book/${rec.id}`} className="text-primary-600 hover:underline">
                        {rec.title}
                      </Link>
                    </h3>
                    <p className="text-gray-600">{rec.author}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {rec.genre} • ★ {rec.rating?.toFixed(1) || 'N/A'}
                    </p>
                  </div>
                  <span className="text-sm text-gray-400">
                    Match: {(rec.similarity_score * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-gray-700 mt-3 text-sm">{rec.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
