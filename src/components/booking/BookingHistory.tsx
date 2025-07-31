import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, Star as StarIcon, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Booking } from '../../types';
import { formatPrice, formatDate } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../contexts/AppContext';

interface BookingHistoryProps {
  onBack: () => void;
}

export const BookingHistory: React.FC<BookingHistoryProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useApp();

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          provider:providers(*),
          service:services(*)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const upcomingBookings = bookings.filter(b => 
    b.status === 'pending' || b.status === 'confirmed'
  );
  const pastBookings = bookings.filter(b => 
    b.status === 'completed' || b.status === 'cancelled'
  );

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusText = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmată';
      case 'pending':
        return 'În așteptare';
      case 'completed':
        return 'Finalizată';
      case 'cancelled':
        return 'Anulată';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;
      
      // Refresh bookings
      fetchBookings();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      alert('Eroare la anularea rezervării');
    }
  };

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all">
      <div className="flex">
        <img
          src={booking.provider?.images[0] || 'https://images.pexels.com/photos/1570807/pexels-photo-1570807.jpeg?auto=compress&cs=tinysrgb&w=800'}
          alt={booking.provider?.salon_name}
          className="w-32 h-full object-cover"
        />
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-slate-800">{booking.provider?.salon_name}</h3>
              <p className="text-sm text-slate-600">{booking.service?.name}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
              {getStatusText(booking.status)}
            </span>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar size={16} />
              <span>{formatDate(booking.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock size={16} />
              <span>{booking.time} • {booking.service?.duration} min</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin size={16} />
              <span>{booking.provider?.address}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-amber-600">
                {formatPrice(booking.total_price)}
              </span>
              {booking.payment_method && (
                <span className="ml-2 text-sm text-slate-500">
                  {booking.payment_method === 'crypto' ? '(Crypto)' : '(Card/Numerar)'}
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              {booking.status === 'completed' && (
                <Button variant="outline" size="sm">
                  <StarIcon size={14} className="mr-1" />
                  Review
                </Button>
              )}
              {(booking.status === 'pending' || booking.status === 'confirmed') && (
                <>
                  <Button variant="outline" size="sm">
                    Reprogramează
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600"
                    onClick={() => handleCancelBooking(booking.id)}
                  >
                    Anulează
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center gap-4 border-b">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Rezervările Mele</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Viitoare ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === 'past'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Istoric ({pastBookings.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'upcoming' ? (
          upcomingBookings.length > 0 ? (
            <div className="space-y-4">
              {upcomingBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nu ai rezervări viitoare</p>
              <Button
                variant="primary"
                onClick={onBack}
                className="mt-4"
              >
                Caută Saloane
              </Button>
            </div>
          )
        ) : (
          pastBookings.length > 0 ? (
            <div className="space-y-4">
              {pastBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nu ai rezervări anterioare</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};