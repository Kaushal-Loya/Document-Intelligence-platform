'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { askQuestion, fetchChatHistory, fetchBooks, AskResponse, ChatMessage, Book } from '@/lib/api';
import { Send, Brain, BookOpen, Loader2, Trash2, User, Bot, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ id: number; title: string }>;
  loading?: boolean;
  id: string;
}

const SAMPLE_QUESTIONS = [
  "What are some good mystery novels in this library?",
  "Tell me about science fiction books available",
  "Which books have the best ratings?",
  "What fantasy books do you recommend?",
  "Summarize the themes in historical fiction",
];

const SESSION_ID = `session_${Math.random().toString(36).slice(2)}`;

export default function QAClient() {
  const searchParams = useSearchParams();
  const preSelectedBookId = searchParams.get('book_id') ? Number(searchParams.get('book_id')) : null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(preSelectedBookId);
  const [books, setBooks] = useState<Book[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Load books for dropdown filter
  useEffect(() => {
    fetchBooks({ page: 1 })
      .then((data) => setBooks(data.results))
      .catch(() => {});
  }, []);

  // Load existing chat history for this session
  useEffect(() => {
    fetchChatHistory(SESSION_ID)
      .then((data) => {
        if (data.results.length > 0) {
          const msgs: Message[] = data.results
            .flatMap((h: ChatMessage) => ([
              { role: 'user' as const, content: h.question, id: `u-${h.id}` },
              { role: 'assistant' as const, content: h.answer, sources: h.sources, id: `a-${h.id}` },
            ]))
            .reverse();
          setMessages(msgs);
        }
      })
      .catch(() => {});
  }, []);

  const sendMessage = async (questionOverride?: string) => {
    const question = (questionOverride || input).trim();
    if (!question || loading) return;

    setInput('');
    const userMsg: Message = { role: 'user', content: question, id: `u-${Date.now()}` };
    const loadingMsg: Message = { role: 'assistant', content: '', loading: true, id: `a-${Date.now()}` };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setLoading(true);

    try {
      const res: AskResponse = await askQuestion({ question, session_id: SESSION_ID, book_id: selectedBookId });
      setMessages((prev) =>
        prev.map((m) => m.loading ? { ...m, loading: false, content: res.answer, sources: res.sources } : m)
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) => m.loading ? { ...m, loading: false, content: 'Sorry, an error occurred. Please try again.' } : m)
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6 fade-in space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(0,245,255,0.3)]">
              <Brain size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold heading-font gradient-text tracking-wide drop-shadow-md">Ask BookMind Neural Engine</h1>
              <p className="text-xs text-cyan-200/60 font-medium">Powered by Gemini AI + Dimension RAG Architecture</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/60 border border-gray-700/50 text-gray-400 hover:text-gray-200 hover:bg-gray-700/60 transition-all text-xs"
            >
              <Trash2 size={12} /> Clear chat
            </button>
          )}
        </div>

        {/* Book filter */}
        <div className="flex items-center gap-2 hyper-glass rounded-xl px-4 py-3 border border-cyan-500/20 shadow-md">
          <BookOpen size={16} className="text-cyan-500/70 flex-shrink-0" />
          <select
            value={selectedBookId ?? ''}
            onChange={(e) => setSelectedBookId(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 bg-transparent text-sm text-cyan-50 font-medium focus:outline-none"
          >
            <option value="" className="bg-[#050b14] text-gray-300">Target Entire Archive Namespace</option>
            {books.map((b) => (
              <option key={b.id} value={b.id} className="bg-[#050b14] text-gray-300">{b.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 space-y-4 mb-4 min-h-[300px] max-h-[55vh] overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-10 space-y-6 fade-in">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/40 flex items-center justify-center pulse-neon shadow-lg">
                <Sparkles size={32} className="text-cyan-400" />
              </div>
              <div className="text-center space-y-1.5">
                <h2 className="text-xl font-bold heading-font text-gray-200">Initiate Local Query Protocol</h2>
                <p className="text-sm text-gray-500 max-w-sm">
                  Neural search connects context across descriptions, abstracts, and metadata vectors.
                </p>
              </div>
              <div className="w-full grid gap-3 max-w-xl mx-auto">
                {SAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    disabled={loading}
                    className="text-left px-5 py-3 rounded-2xl cyber-glass border border-gray-700/60 text-sm text-gray-400 hover:text-cyan-100 hover:bg-cyan-900/10 hover:border-cyan-500/40 transition-all font-medium disabled:opacity-50"
                  >
                    <span className="text-cyan-500 mr-3 font-bold">→</span>{q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_15px_rgba(0,245,255,0.4)]">
                    <Bot size={18} className="text-white" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2 flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-5 py-3.5 rounded-3xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-tr from-cyan-800 to-purple-800 text-white rounded-br-sm shadow-[0_0_15px_rgba(181,55,242,0.2)]'
                      : 'hyper-glass shadow-lg border border-cyan-500/20 text-gray-200 rounded-bl-sm'
                  }`}>
                    {msg.loading ? (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Loader2 size={14} className="animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>

                  {/* Source citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-xs text-gray-600">Sources:</span>
                      {msg.sources.map((src) => (
                        <Link
                          key={src.id}
                          href={`/books/${src.id}`}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-800/60 border border-gray-700/40 text-xs text-indigo-400 hover:text-indigo-300 hover:border-indigo-500/40 transition-all"
                        >
                          <BookOpen size={10} />
                          {src.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-1">
                    <User size={14} className="text-gray-300" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <div className="hyper-glass rounded-3xl border border-cyan-500/30 p-3 fade-in shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Query dimensions, genres, metadata..."
              rows={2}
              className="flex-1 bg-transparent text-sm font-medium text-gray-100 placeholder-gray-500 resize-none focus:outline-none leading-relaxed p-2"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-12 h-12 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg shadow-cyan-600/40 active:scale-95 text-white"
            >
              {loading
                ? <Loader2 size={18} className="animate-spin" />
                : <Send size={18} />
              }
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2 font-medium px-2">Enter to transmit · Shift+Enter to break line</p>
        </div>
      </div>
    </div>
  );
}
