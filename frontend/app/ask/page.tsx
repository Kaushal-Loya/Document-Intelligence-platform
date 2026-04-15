'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    book_id: number;
    text: string;
    similarity: number;
  }>;
  cached?: boolean;
}

interface Book {
  id: number;
  title: string;
}

export default function AskPage() {
  const searchParams = useSearchParams();
  const preselectedBook = searchParams.get('book');

  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>(preselectedBook || '');
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/books/');
      const data = await response.json();
      setBooks(data.results || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await fetch('/api/ask/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          book_id: selectedBook ? parseInt(selectedBook) : null,
          session_id: sessionId,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        cached: data.cached,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error asking question:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your question. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Ask about Books</h1>
      <p className="text-gray-600 mb-6">
        Ask questions about any book in your library. The AI will find relevant information and cite sources.
      </p>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select a book to focus on (optional):
          </label>
          <select
            value={selectedBook}
            onChange={(e) => setSelectedBook(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">All books</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </select>
        </div>

        <div className="h-96 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <p className="text-lg mb-2">Start asking questions!</p>
              <p className="text-sm">Example: "What is the main theme of Pride and Prejudice?"</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3/4 rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>

                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Sources:</p>
                        <div className="flex flex-wrap gap-1">
                          {message.sources.map((source, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-gray-200 px-2 py-1 rounded"
                            >
                              [{idx + 1}] {source.similarity.toFixed(2)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {message.cached && (
                      <span className="text-xs text-gray-500 mt-2 block">
                        (cached)
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
              className="flex-1 border rounded-lg px-4 py-2 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Thinking...' : 'Ask'}
            </button>
          </div>
        </form>
      </div>

      <div className="text-center">
        <Link href="/" className="text-primary-600 hover:underline">
          ← Back to Library
        </Link>
      </div>
    </div>
  );
}
