import React, { useState, useEffect } from 'react';
import { Star as StarIcon, MessageCircle, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { Review } from '../../types';
import { formatRelativeTime } from '../../lib/utils';

interface ReviewDashboardProps {
  providerId: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  trend: number;
  responseRate: number;
}

export const ReviewDashboard: React.FC<ReviewDashboardProps> = ({ providerId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'responded' | 'pending'>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [providerId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          users (name, avatar_url),
          bookings (
            services (name)
          )
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: allReviews } = await supabase
        .from('reviews')
        .select('rating, response, created_at')
        .eq('provider_id', providerId);

      if (!allReviews || allReviews.length === 0) {
        setStats({
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          trend: 0,
          responseRate: 0,
        });
        return;
      }

      // Calculate average rating
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / allReviews.length;

      // Calculate rating distribution
      const ratingDistribution = allReviews.reduce((acc, r) => {
        acc[r.rating] = (acc[r.rating] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      // Calculate response rate
      const respondedReviews = allReviews.filter(r => r.response).length;
      const responseRate = (respondedReviews / allReviews.length) * 100;

      // Calculate trend (compare last 30 days to previous 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const recentReviews = allReviews.filter(r => 
        new Date(r.created_at) >= thirtyDaysAgo
      );
      const previousReviews = allReviews.filter(r => 
        new Date(r.created_at) >= sixtyDaysAgo && 
        new Date(r.created_at) < thirtyDaysAgo
      );

      const recentAvg = recentReviews.length > 0
        ? recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length
        : 0;
      const previousAvg = previousReviews.length > 0
        ? previousReviews.reduce((sum, r) => sum + r.rating, 0) / previousReviews.length
        : 0;

      const trend = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

      setStats({
        averageRating,
        totalReviews: allReviews.length,
        ratingDistribution,
        trend,
        responseRate,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const validateReply = (text: string): string | null => {
    const trimmedText = text.trim();
    
    if (!trimmedText) {
      return 'Răspunsul nu poate fi gol';
    }
    
    if (trimmedText.length < 10) {
      return 'Răspunsul trebuie să aibă cel puțin 10 caractere';
    }
    
    if (trimmedText.length > 500) {
      return 'Răspunsul nu poate depăși 500 de caractere';
    }
    
    // Verifică pentru limbaj nepotrivit
    const inappropriateWords = ['nasol', 'prost', 'idiot', 'stupid', 'imbecil'];
    const lowerText = trimmedText.toLowerCase();
    for (const word of inappropriateWords) {
      if (lowerText.includes(word)) {
        return 'Răspunsul conține limbaj nepotrivit. Vă rugăm să fiți respectuos';
      }
    }
    
    // Verifică pentru spam (text repetitiv)
    const words = trimmedText.split(' ');
    const uniqueWords = new Set(words);
    if (words.length > 5 && uniqueWords.size / words.length < 0.5) {
      return 'Răspunsul pare să conțină text repetitiv';
    }
    
    return null;
  };

  const handleReplyTextChange = (reviewId: string, text: string) => {
    setReplyText(text);
    
    // Validare în timp real
    const error = validateReply(text);
    setReplyErrors(prev => ({
      ...prev,
      [reviewId]: error || ''
    }));
  };

  const handleReply = async (reviewId: string) => {
    const trimmedText = replyText.trim();
    
    // Validare finală
    const validationError = validateReply(trimmedText);
    if (validationError) {
      setReplyErrors(prev => ({
        ...prev,
        [reviewId]: validationError
      }));
      return;
    }

    setSubmitting(true);
    try {
      // Verifică dacă review-ul nu are deja răspuns
      const review = reviews.find(r => r.id === reviewId);
      if (review?.response) {
        setReplyErrors(prev => ({
          ...prev,
          [reviewId]: 'Această recenzie are deja un răspuns'
        }));
        return;
      }

      const { error } = await supabase
        .from('reviews')
        .update({ 
          response: trimmedText,
          responded_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;

      // Update local state
      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { 
          ...r, 
          response: trimmedText,
          responded_at: new Date().toISOString()
        } : r
      ));
      setReplyingTo(null);
      setReplyText('');
      setReplyErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[reviewId];
        return newErrors;
      });
      
      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Failed to submit reply:', error);
      setReplyErrors(prev => ({
        ...prev,
        [reviewId]: 'Eroare la trimiterea răspunsului. Vă rugăm încercați din nou.'
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'responded') return review.response;
    if (filter === 'pending') return !review.response;
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Astăzi';
    if (diffInDays === 1) return 'Ieri';
    if (diffInDays < 7) return `Acum ${diffInDays} zile`;
    if (diffInDays < 30) return `Acum ${Math.floor(diffInDays / 7)} săptămâni`;
    return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-slate-200 rounded-xl"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <StarIcon className="text-amber-600" size={24} />
              <div className={`flex items-center gap-1 text-sm ${
                stats.trend >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {stats.trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {Math.abs(stats.trend).toFixed(1)}%
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.averageRating.toFixed(1)}</p>
            <p className="text-sm text-slate-600">Rating Mediu</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <MessageCircle className="text-blue-600 mb-2" size={24} />
            <p className="text-2xl font-bold text-slate-800">{stats.totalReviews}</p>
            <p className="text-sm text-slate-600">Total Recenzii</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <MessageCircle className="text-purple-600 mb-2" size={24} />
            <p className="text-2xl font-bold text-slate-800">{stats.responseRate.toFixed(0)}%</p>
            <p className="text-sm text-slate-600">Rată Răspuns</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 w-3">{rating}</span>
                  <StarIcon size={14} className="text-amber-400 fill-current" />
                  <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-600 h-full transition-all duration-300"
                      style={{
                        width: `${(stats.ratingDistribution[rating] || 0) / stats.totalReviews * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-8 text-right">
                    {stats.ratingDistribution[rating] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-600'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            Toate ({reviews.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-600'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            Fără Răspuns ({reviews.filter(r => !r.response).length})
          </button>
          <button
            onClick={() => setFilter('responded')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              filter === 'responded'
                ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-600'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            Cu Răspuns ({reviews.filter(r => r.response).length})
          </button>
        </div>

        {/* Reviews List */}
        <div className="divide-y divide-slate-200">
          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Nu există recenzii în această categorie
            </div>
          ) : (
            filteredReviews.map(review => (
              <div key={review.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {review.users?.avatar_url ? (
                      <img
                        src={review.users.avatar_url}
                        alt={review.users.name || 'User'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="font-bold text-amber-600">
                        {review.users?.name?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-800">
                          {review.users?.name || 'Utilizator Anonim'}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map(star => (
                              <StarIcon
                                key={star}
                                size={16}
                                className={`${
                                  star <= review.rating
                                    ? 'text-amber-400 fill-current'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-slate-500">
                            {formatRelativeTime(review.created_at)}
                          </span>
                          {review.bookings?.services?.name && (
                            <span className="text-sm text-slate-500">
                              • {review.bookings.services.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-700 mb-3">{review.comment}</p>

                    {/* Response */}
                    {review.response ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-emerald-800">
                            ✓ Răspunsul tău:
                          </p>
                          {review.responded_at && (
                            <span className="text-xs text-emerald-600">
                              {formatDate(review.responded_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-emerald-700">{review.response}</p>
                      </div>
                    ) : (
                      <>
                        {replyingTo === review.id ? (
                          <div className="mt-3">
                            <div className="relative">
                              <textarea
                                value={replyText}
                                onChange={(e) => handleReplyTextChange(review.id, e.target.value)}
                                placeholder="Scrie un răspuns profesional și respectuos..."
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 ${
                                  replyErrors[review.id]
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-slate-300 focus:border-amber-500 focus:ring-amber-500'
                                }`}
                                rows={3}
                                autoFocus
                                maxLength={500}
                              />
                              <div className="absolute bottom-2 right-2 text-xs text-slate-400">
                                {replyText.length}/500
                              </div>
                            </div>
                            
                            {replyErrors[review.id] && (
                              <p className="text-red-600 text-sm mt-1">
                                {replyErrors[review.id]}
                              </p>
                            )}
                            
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                              <p className="text-blue-800 text-sm font-medium mb-1">
                                💡 Sfaturi pentru un răspuns eficient:
                              </p>
                              <ul className="text-blue-700 text-xs space-y-1">
                                <li>• Mulțumește clientului pentru feedback</li>
                                <li>• Adresează problemele specifice menționate</li>
                                <li>• Oferă soluții sau explicații constructive</li>
                                <li>• Menține un ton profesional și empatic</li>
                                <li>• Invită clientul să revină pentru o experiență mai bună</li>
                              </ul>
                            </div>
                            
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                onClick={() => handleReply(review.id)}
                                loading={submitting}
                                disabled={!replyText.trim() || !!replyErrors[review.id] || submitting}
                              >
                                Trimite Răspuns
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyText('');
                                  setReplyErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors[review.id];
                                    return newErrors;
                                  });
                                }}
                                disabled={submitting}
                              >
                                Anulează
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setReplyingTo(review.id)}
                          >
                            <MessageCircle size={14} className="mr-2" />
                            Răspunde
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};