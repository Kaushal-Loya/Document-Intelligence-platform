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
    <div className="min-h-screen relative overflow-hidden">
      {/* Massive Cinematic Blurred Background */}
      <div 
        className="absolute top-0 left-0 w-full h-[60vh] opacity-20 pointer-events-none blur-3xl z-0"
        style={{ backgroundImage: `url(${book.cover_image})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(80px)' }}
      />
      <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-transparent via-[#030206] to-[#030206] z-0 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 relative z-10 space-y-8 mt-10">
        {/* Back + Delete */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-cyan-400/80 hover:text-cyan-300 transition-colors text-sm font-medium">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all text-sm font-medium"
          >
            <Trash2 size={14} /> Delete book
          </button>
        </div>

        {/* Main card */}
        <div className="hyper-glass rounded-3xl overflow-hidden shadow-2xl shadow-indigo-900/10 fade-in">
          <div className="flex flex-col md:flex-row gap-0">
            {/* Cover */}
            <div className="md:w-72 flex-shrink-0 p-6 md:p-8 flex justify-center items-center relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 to-purple-900/20 opacity-50 1" />
              <div className="relative h-96 w-full shadow-2xl rounded-xl overflow-hidden border border-white/10 group">
                <img
                  src={book.cover_image || 'https://via.placeholder.com/300x400/1e293b/6366f1?text=📖'}
                  alt={book.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400/1e293b/6366f1?text=📖'; }}
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 p-6 md:p-8 md:pl-0 space-y-6 flex flex-col justify-center relative">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-5xl font-bold heading-font text-white leading-tight tracking-tight drop-shadow-md">{book.title}</h1>
                <div className="flex items-center gap-2 text-cyan-300 font-medium">
                  <Users size={16} />
                  <span className="text-lg">{book.author || 'Unknown Author'}</span>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-3">
                <div className={`genre-badge genre-${book.genre || 'other'} flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase`}>
                  <Tag size={13} />
                  {book.genre?.replace('-', ' ') || 'other'}
                </div>
                <SentimentBadge sentiment={book.sentiment || 'neutral'} />
                {book.ai_processed && (
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border bg-[#050b14] border-cyan-500/40 text-sm text-cyan-300 shadow-[0_0_10px_rgba(0,245,255,0.2)] font-medium">
                    <CheckCircle2 size={14} className="text-cyan-400" /> AI Parsed
                  </div>
                )}
              </div>

              <div className="bg-black/30 p-3 rounded-xl inline-flex items-center">
                <StarRating rating={book.rating} />
                {book.reviews_count > 0 && (
                  <span className="text-xs text-gray-500 ml-3 pl-3 border-l border-white/10">{book.reviews_count.toLocaleString()} analyses</span>
                )}
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Link href={`/qa?book_id=${book.id}`}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm text-[#030206] font-bold transition-all shadow-[0_0_20px_rgba(0,245,255,0.3)]">
                  <MessageSquare size={16} /> Neural Query Protocol
                </Link>
                {book.book_url && (
                  <a href={book.book_url} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white font-medium transition-all">
                    <ExternalLink size={15} /> Access Source
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights & Description */}
        <div className="grid md:grid-flow-col gap-6" style={{ gridTemplateColumns: book.summary ? '1fr 1fr' : '1fr' }}>
          {book.summary && (
             <div className="hyper-glass rounded-3xl p-8 shadow-[0_0_30px_rgba(0,245,255,0.05)] border-t border-cyan-500/50 relative overflow-hidden fade-in">
               <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
               <div className="flex items-center gap-3 text-cyan-400 mb-4 font-bold tracking-wider uppercase text-sm border-b border-cyan-500/20 pb-3">
                 <Brain size={18} />
                 <span>Primary Abstract Isolation</span>
               </div>
               <p className="text-cyan-50/90 text-base leading-relaxed font-light">{book.summary}</p>
             </div>
          )}

          {book.description && (
            <div className="glass rounded-3xl p-8 border border-white/5 bg-[#080512]/50 relative overflow-hidden fade-in">
              <div className="flex items-center gap-3 text-purple-400 mb-4 font-bold tracking-wider uppercase text-sm border-b border-purple-500/20 pb-3">
                <BookOpen size={18} />
                <span>Raw Source Schema</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{book.description}</p>
            </div>
          )}
        </div>
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
