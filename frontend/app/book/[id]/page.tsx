'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Star, 
  ExternalLink, 
  MessageSquare, 
  BookOpen, 
  Tags, 
  BrainCircuit, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Smile,
  Frown,
  Meh
} from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Retrieving book intelligence...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-20 space-y-6">
        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
           <BookOpen className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Document not found</h2>
          <p className="text-slate-500">The file might have been removed or processed incorrectly.</p>
        </div>
        <Link href="/" className="inline-flex items-center gap-2 text-primary-600 font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Return to Library
        </Link>
      </div>
    );
  }

  const sentimentIcon = {
    positive: <Smile className="w-4 h-4 text-green-600" />,
    negative: <Frown className="w-4 h-4 text-red-600" />,
    neutral: <Meh className="w-4 h-4 text-slate-600" />
  }[book.sentiment as 'positive' | 'negative' | 'neutral'] || <Meh className="w-4 h-4 text-slate-600" />;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <Link href="/" className="group inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Library
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {book.is_processed ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Agent
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-yellow-100">
                    <Clock className="w-3 h-3" />
                    Indexing Details
                  </span>
                )}
                {book.genre && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-primary-100">
                    <Tags className="w-3 h-3" />
                    {book.genre}
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                {book.title}
              </h1>
              <p className="text-xl text-slate-500 font-medium">by {book.author}</p>
            </div>

            <div className="flex flex-wrap items-center gap-6 py-2 border-y border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex items-center text-yellow-500">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <span className="font-bold text-lg">{book.rating?.toFixed(1) || 'N/A'}</span>
                <span className="text-slate-400 text-sm">({book.reviews_count.toLocaleString()} ratings)</span>
              </div>
              
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-2xl border ${
                book.sentiment === 'positive' ? 'bg-green-50 border-green-100' :
                book.sentiment === 'negative' ? 'bg-red-50 border-red-100' :
                'bg-slate-50 border-slate-200'
              }`}>
                {sentimentIcon}
                <span className="text-xs font-bold uppercase tracking-wider">{book.sentiment || 'Neutral'} Tone</span>
              </div>
            </div>

            <div className="space-y-4">
               <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900">
                 <BookOpen className="w-5 h-5 text-primary-600" />
                 Original Description
               </h2>
               <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                 {book.description || 'Raw content could not be retrieved during the initial scrape.'}
               </p>
            </div>
            
            <div className="flex gap-4 pt-4">
              <Link
                href={`/ask?book=${book.id}`}
                className="flex-1 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-primary-600 shadow-xl shadow-slate-900/10 transition-all active:scale-95"
              >
                <MessageSquare className="w-5 h-5" />
                Ask AI Assistant
              </Link>
              {book.book_url && (
                <a
                  href={book.book_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-white border rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95"
                >
                  <ExternalLink className="w-5 h-5" />
                  View Source
                </a>
              )}
            </div>
          </motion.div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="space-y-8">
          {/* AI Summary Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-100 rounded-2xl text-primary-600">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">AI Summary</h2>
            </div>
            
            <p className="text-slate-600 text-sm leading-relaxed italic">
              "{book.summary || 'AI Analysis in progress. Check back shortly for an automated executive summary.'}"
            </p>
            
            <div className="pt-4 flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
               <span>PROCESSED CHUNKS: {book.chunks_count}</span>
               <span>MODEL: LM STUDIO / LG</span>
            </div>
          </motion.div>

          {/* Recommendations Area */}
          {recommendations.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Discover Similar
              </h2>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <motion.div 
                    key={rec.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 bg-white border border-slate-100 rounded-[2rem] hover:shadow-xl transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold group-hover:text-primary-600 transition-colors">
                        <Link href={`/book/${rec.id}`}>{rec.title}</Link>
                      </h3>
                      <span className="text-[10px] bg-slate-50 px-2 py-0.5 rounded-full border font-bold text-slate-400">
                        {Math.round(rec.similarity_score * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mb-3">by {rec.author}</p>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed italic">
                      {rec.reasoning}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
