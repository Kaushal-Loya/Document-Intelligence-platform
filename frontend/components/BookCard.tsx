import { Book } from '@/lib/api';
import { Star, Trash2, ExternalLink, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface BookCardProps {
  book: Book;
  onDelete: (id: number, title: string) => void;
}

const FALLBACK_COVER = 'https://covers.openlibrary.org/b/id/0-M.jpg';

function StarRating({ rating }: { rating: number | string | null }) {
  if (!rating) return null;
  const numRating = Number(rating);
  const stars = Math.round(numRating);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          className={s <= stars ? 'star-filled fill-current' : 'star-empty'}
        />
      ))}
      <span className="text-xs text-gray-400 ml-1">{numRating.toFixed(1)}</span>
    </div>
  );
}

function GenreBadge({ genre }: { genre: string }) {
  return (
    <span className={`genre-${genre} text-xs font-medium px-2 py-0.5 rounded-full border capitalize`}>
      {genre.replace('-', ' ')}
    </span>
  );
}

function SentimentDot({ sentiment }: { sentiment: string }) {
  const colors: Record<string, string> = {
    positive: 'bg-emerald-400',
    negative: 'bg-red-400',
    neutral: 'bg-gray-400',
    mixed: 'bg-amber-400',
  };
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colors[sentiment] || 'bg-gray-400'}`}
      title={`Sentiment: ${sentiment}`}
    />
  );
}

export default function BookCard({ book, onDelete }: BookCardProps) {
  const cover = book.cover_image || FALLBACK_COVER;

  return (
    <div className="book-card glass rounded-2xl overflow-hidden border border-indigo-500/10 group relative fade-in">
      {/* Delete button */}
      <button
        onClick={(e) => { e.preventDefault(); onDelete(book.id, book.title); }}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-gray-900/80 backdrop-blur-md border border-red-500/40 
                   flex items-center justify-center opacity-90 transition-all duration-200
                   hover:bg-red-500/40 hover:scale-110 hover:opacity-100 shadow-md"
        title="Delete book"
      >
        <Trash2 size={12} className="text-red-400" />
      </button>

      <Link href={`/books/${book.id}`} className="block">
        {/* Cover image */}
        <div className="relative h-52 w-full overflow-hidden bg-gray-900">
          <img
            src={cover}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400/1e293b/6366f1?text=📖'; }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />

          {/* AI badge */}
          {book.ai_processed && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-indigo-600/80 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs text-white border border-indigo-400/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI
            </div>
          )}
        </div>

        {/* Card info (top part) */}
        <div className="p-4 pb-0 space-y-2">
          <h3 className="font-semibold text-gray-100 text-sm leading-snug line-clamp-2 group-hover:text-indigo-300 transition-colors">
            {book.title}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <User size={11} />
            <span className="line-clamp-1">{book.author || 'Unknown Author'}</span>
          </div>
        </div>
      </Link>

      {/* Interactive Bottom Tray (Outside of main Link to avoid nested <a>) */}
      <div className="p-4 pt-2 space-y-2">
        <div className="flex items-center justify-between">
          <StarRating rating={book.rating} />
          <div className="flex items-center gap-1.5">
            <SentimentDot sentiment={book.sentiment} />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <GenreBadge genre={book.genre || 'other'} />
          {book.book_url && (
            <a
              href={book.book_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-indigo-400 transition-colors"
            >
              <ExternalLink size={12} />
            </a>
          )}
        </div>

        {book.summary && (
          <Link href={`/books/${book.id}`}>
            <p className="text-xs text-gray-500 line-clamp-2 mt-1 hover:text-gray-400 transition-colors">
              {book.summary}
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}
