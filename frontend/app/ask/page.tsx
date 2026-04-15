'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  ChevronLeft, 
  Book as BookIcon,
  Sparkles,
  Search,
  Zap,
  Quote,
  Loader2
} from 'lucide-react';

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
        content: 'I encountered an issue while processing your request. Please ensure the backend server is running and try again.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const currentBookTitle = books.find(b => b.id.toString() === selectedBook)?.title;

  return (
    <div className="max-w-4xl mx-auto space-y-6 flex flex-col h-[calc(100vh-160px)]">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Assistant</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary-500" />
              Powered by RAG & Local LLM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <BookIcon className="w-4 h-4 text-slate-400" />
          <select
            value={selectedBook}
            onChange={(e) => setSelectedBook(e.target.value)}
            className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer hover:text-primary-600 transition-colors"
          >
            <option value="">Exploring All Books</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                Focus: {book.title}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 glass-card rounded-3xl flex flex-col overflow-hidden relative border shadow-2xl">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="w-20 h-20 bg-primary-100 rounded-3xl flex items-center justify-center text-primary-600">
                <Bot className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">How can I help you today?</h3>
                <p className="text-slate-400 max-w-sm">
                  {selectedBook 
                    ? `I'm ready to answer anything about "${currentBookTitle}".`
                    : "I can search across your entire library to find exactly what you're looking for."}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                {[
                  "What are the key themes?",
                  "Give me a summary",
                  "Who is the protagonist?",
                  "Analyze the writing style"
                ].map((hint) => (
                  <button
                    key={hint}
                    disabled={loading}
                    onClick={() => {
                        setQuestion(hint);
                    }}
                    className="p-3 text-sm bg-slate-50 border rounded-2xl hover:bg-slate-100 hover:border-slate-300 transition-all text-slate-600 font-medium"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm ${
                    message.role === 'user' 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-primary-600 text-white'
                  }`}>
                    {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>

                  <div className={`space-y-4 max-w-[85%] ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      message.role === 'user'
                        ? 'bg-slate-900 text-white rounded-tr-none'
                        : 'bg-white border text-slate-800 rounded-tl-none'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      
                      {message.cached && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] opacity-60 font-bold uppercase tracking-wider">
                          <Zap className="w-3 h-3" />
                          Retrieved from Cache
                        </div>
                      )}
                    </div>

                    {message.sources && message.sources.length > 0 && (
                      <div className={`flex flex-col gap-3 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Quote className="w-3 h-3" />
                          Contextual Sources
                        </span>
                        <div className="grid grid-cols-1 gap-2 w-full">
                          {message.sources.map((source, idx) => (
                            <motion.div 
                              whileHover={{ scale: 1.01 }}
                              key={idx}
                              className="p-3 bg-slate-50 border rounded-xl text-xs text-slate-600 line-clamp-2 hover:line-clamp-none transition-all cursor-help relative group"
                            >
                                <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-white border rounded text-[8px] font-bold group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                    {Math.round(source.similarity * 100)}% Match
                                </div>
                                {source.text}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary-600 text-white flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                  <div className="bg-white border px-5 py-3 rounded-2xl rounded-tl-none font-medium text-slate-400 text-sm animate-pulse">
                    Synthesizing knowledge...
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-slate-50/50 border-t backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="relative group">
            <input
              type="text"
              placeholder={selectedBook ? `Ask about "${currentBookTitle}"...` : "Ask anything about your books..."}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
              className="w-full pl-6 pr-14 py-4 bg-white border rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all shadow-sm group-hover:shadow-md"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-primary-600 transition-all disabled:opacity-30 active:scale-90 shadow-lg"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
          <p className="mt-4 text-center text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em]">
            Verified Source Intelligence &bull; Cross-Platform RAG
          </p>
        </div>
      </div>
    </div>
  );
}
