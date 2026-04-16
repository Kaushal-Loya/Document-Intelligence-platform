'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchBook, fetchRecommendations, deleteBook, Book } from '@/lib/api';
import Link from 'next/link';
import {
  Star, ArrowLeft, ExternalLink, Brain, Smile, Meh, Frown, Tag,
  BookOpen, Users, Trash2, Loader2, MessageSquare, CheckCircle2
} from 'lucide-react';

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-gray-500 text-sm">No rating</span>;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} size={16} className={s <= Math.round(rating) ? 'star-filled fill-current' : 'star-empty'} />
        ))}
      </div>
      <span className="text-sm font-semibold text-gray-200">{Number(rating).toFixed(1)}</span>
      <span className="text-sm text-gray-500">/ 5</span>
    </div>
  );
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const configs: Record<string, { icon: any; color: string; bg: string }> = {
    positive: { icon: Smile, color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40' },
    neutral: { icon: Meh, color: 'text-gray-400', bg: 'bg-gray-500/20 border-gray-500/40' },
    negative: { icon: Frown, color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/40' },
    mixed: { icon: Meh, color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/40' },
  };
  const cfg = configs[sentiment] || configs.neutral;
  const Icon = cfg.icon;
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${cfg.bg} text-sm`}>
      <Icon size={14} className={cfg.color} />
      <span className={`${cfg.color} font-medium capitalize`}>{sentiment}</span>
    </div>
  );
}

function GenrePill({ genre }: { genre: string }) {
  return (
    <div className={`genre-${genre} flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm`}>
      <Tag size={13} />
      <span className="capitalize font-medium">{genre?.replace('-', ' ') || 'other'}</span>
    </div>
  );
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [book, setBook] = useState<Book | null>(null);
  const [recs, setRecs] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [bookData, recData] = await Promise.all([
          fetchBook(id),
          fetchRecommendations(id),
        ]);
        setBook(bookData);
        setRecs(recData.results);
      } catch { router.push('/'); }
      finally { setLoading(false); }
    };
    if (id) load();
  }, [id]);

  const handleDelete = async () => {
    if (!book) return;
    setDeleting(true);
    try {
      await deleteBook(book.id);
      router.refresh(); // Soft refresh the platform cache
      router.push('/');
    } catch { setDeleting(false); setShowDeleteConfirm(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-indigo-400" />
          <p className="text-gray-500">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Back + Delete */}
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors text-sm">
          <ArrowLeft size={16} /> Back to Library
        </Link>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>

      {/* Main card */}
      <div className="glass rounded-2xl overflow-hidden border border-indigo-500/15 fade-in">
        <div className="flex flex-col md:flex-row gap-0">
          {/* Cover */}
          <div className="md:w-64 flex-shrink-0">
            <div className="relative h-80 md:h-full min-h-[320px] bg-gray-900 overflow-hidden">
              <img
                src={book.cover_image || 'https://via.placeholder.com/300x400/1e293b/6366f1?text=📖'}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400/1e293b/6366f1?text=📖'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-gray-900/60" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 p-6 md:p-8 space-y-5">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-100 leading-tight">{book.title}</h1>
              <div className="flex items-center gap-1.5 text-gray-400">
                <Users size={15} />
                <span className="text-base">{book.author || 'Unknown Author'}</span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <GenrePill genre={book.genre || 'other'} />
              <SentimentBadge sentiment={book.sentiment || 'neutral'} />
              {book.ai_processed && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-indigo-600/20 border-indigo-500/40 text-sm text-indigo-300">
                  <CheckCircle2 size={13} /> AI Processed
                </div>
              )}
            </div>

            <StarRating rating={book.rating} />

            {book.reviews_count > 0 && (
              <p className="text-xs text-gray-500">{book.reviews_count.toLocaleString()} reviews</p>
            )}

            {/* Links */}
            <div className="flex gap-3">
              {book.book_url && (
                <a href={book.book_url} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm text-white font-medium transition-all">
                  <ExternalLink size={14} /> View on Open Library
                </a>
              )}
              <Link href={`/qa?book_id=${book.id}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-sm text-purple-300 font-medium transition-all">
                <MessageSquare size={14} /> Ask About This Book
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="grid md:grid-cols-2 gap-5">
        {book.summary && (
          <div className="glass rounded-2xl p-5 border border-indigo-500/15 space-y-3 fade-in">
            <div className="flex items-center gap-2 text-indigo-300">
              <Brain size={16} />
              <h2 className="font-semibold text-sm uppercase tracking-wider">AI Summary</h2>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{book.summary}</p>
          </div>
        )}

        {book.description && (
          <div className="glass rounded-2xl p-5 border border-gray-700/30 space-y-3 fade-in">
            <div className="flex items-center gap-2 text-gray-400">
              <BookOpen size={16} />
              <h2 className="font-semibold text-sm uppercase tracking-wider">Description</h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">{book.description}</p>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {recs.length > 0 && (
        <div className="space-y-4 fade-in">
          <h2 className="text-lg font-bold text-gray-200 flex items-center gap-2">
            <Star size={18} className="text-amber-400" />
            You Might Also Like
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {recs.map((rec) => (
              <Link key={rec.id} href={`/books/${rec.id}`}
                    className="book-card glass rounded-xl overflow-hidden border border-indigo-500/10 block">
                <div className="h-32 bg-gray-900 overflow-hidden">
                  <img
                    src={rec.cover_image || 'https://via.placeholder.com/150x200/1e293b/6366f1?text=📖'}
                    alt={rec.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x200/1e293b/6366f1?text=📖'; }}
                  />
                </div>
                <div className="p-2 space-y-1">
                  <p className="text-xs font-medium text-gray-200 line-clamp-2">{rec.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{rec.author}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass rounded-2xl p-6 max-w-sm w-full border border-red-500/30 space-y-4 fade-in">
            <h3 className="text-lg font-semibold text-gray-100">Delete Book</h3>
            <p className="text-sm text-gray-400">
              Delete <span className="text-gray-200 font-medium">"{book.title}"</span> and all its embeddings?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-2 rounded-xl bg-gray-800 border border-gray-700/60 text-sm text-gray-300 hover:bg-gray-700 transition-all">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                      className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-sm text-white font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {deleting ? <Loader2 size={14} className="animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
