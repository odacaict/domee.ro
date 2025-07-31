import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, DollarSign, Download, Grid, List } from 'lucide-react';
import { Button } from '../ui/Button';
import { Booking } from '../../types';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/utils';

interface CalendarViewProps {
  providerId: string;
}

type ViewMode = 'day' | 'week' | 'month';
type DisplayMode = 'grid' | 'list';

export const CalendarView: React.FC<CalendarViewProps> = ({ providerId }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [providerId, currentDate, viewMode]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          users (name, phone, email),
          services (name, duration, price)
        `)
        .eq('provider_id', providerId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { startDate: start, endDate: end };
  };

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const multiplier = direction === 'next' ? 1 : -1;

    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + multiplier);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (7 * multiplier));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + multiplier);
        break;
    }

    setCurrentDate(newDate);
  };

  const formatDateHeader = () => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };
    
    switch (viewMode) {
      case 'day':
        return currentDate.toLocaleDateString('ro-RO', { ...options, day: 'numeric' });
      case 'week':
        const { startDate, endDate } = getDateRange();
        return `${startDate.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      case 'month':
        return currentDate.toLocaleDateString('ro-RO', options);
    }
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;
      
      // Refresh bookings
      fetchBookings();
      setSelectedBooking(null);
    } catch (error) {
      console.error('Failed to update booking status:', error);
      alert('Eroare la actualizarea statusului');
    }
  };

  const exportToICal = () => {
    // Generate iCal format
    const icalData = bookings.map(booking => {
      const startDateTime = new Date(`${booking.date}T${booking.time}`);
      const endDateTime = new Date(startDateTime.getTime() + (booking.service?.duration || 30) * 60000);
      
      return `BEGIN:VEVENT
DTSTART:${startDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${booking.service?.name || 'Rezervare'} - ${booking.user?.name || 'Client'}
DESCRIPTION:Client: ${booking.user?.name}\\nTelefon: ${booking.user?.phone}\\nServiciu: ${booking.service?.name}\\nPreț: ${formatPrice(booking.total_price)}
STATUS:${booking.status.toUpperCase()}
END:VEVENT`;
    }).join('\n');

    const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//domee.ro//Calendar//EN
${icalData}
END:VCALENDAR`;

    // Download file
    const blob = new Blob([icalContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar_${currentDate.toISOString().split('T')[0]}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 16 }, (_, i) => i + 8); // 8:00 - 23:00
    const dayBookings = bookings.filter(b => 
      new Date(b.date).toDateString() === currentDate.toDateString()
    );

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-[80px_1fr]">
          {/* Time column */}
          <div className="border-r border-slate-200">
            {hours.map(hour => (
              <div key={hour} className="h-20 border-b border-slate-200 px-2 py-1 text-xs text-slate-500">
                {hour}:00
              </div>
            ))}
          </div>

          {/* Bookings column */}
          <div className="relative">
            {hours.map(hour => (
              <div key={hour} className="h-20 border-b border-slate-200" />
            ))}
            
            {/* Render bookings */}
            {dayBookings.map(booking => {
              const [hours, minutes] = booking.time.split(':').map(Number);
              const top = ((hours - 8) * 80) + (minutes / 60 * 80);
              const height = (booking.service?.duration || 30) / 60 * 80;

              return (
                <div
                  key={booking.id}
                  className={`absolute left-2 right-2 p-2 rounded-lg border cursor-pointer ${getStatusColor(booking.status)}`}
                  style={{ top: `${top}px`, height: `${height}px` }}
                  onClick={() => setSelectedBooking(booking)}
                >
                  <p className="font-medium text-sm truncate">{booking.service?.name}</p>
                  <p className="text-xs truncate">{booking.user?.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-200">
          {bookings.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Nu există rezervări în această perioadă
            </div>
          ) : (
            bookings.map(booking => (
              <div
                key={booking.id}
                className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => setSelectedBooking(booking)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                      <span className="text-sm text-slate-600">
                        {new Date(booking.date).toLocaleDateString('ro-RO', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                      <span className="text-sm font-medium">{booking.time}</span>
                    </div>
                    <h4 className="font-semibold text-slate-800">{booking.service?.name}</h4>
                    <p className="text-sm text-slate-600">{booking.user?.name} • {booking.user?.phone}</p>
                  </div>
                  <p className="font-semibold text-amber-600">{formatPrice(booking.total_price)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-96 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigatePeriod('prev')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold text-slate-800">{formatDateHeader()}</h2>
          <button
            onClick={() => navigatePeriod('next')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Selector */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {(['day', 'week', 'month'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {mode === 'day' ? 'Zi' : mode === 'week' ? 'Săptămână' : 'Lună'}
              </button>
            ))}
          </div>

          {/* Display Mode Toggle */}
          <button
            onClick={() => setDisplayMode(displayMode === 'grid' ? 'list' : 'grid')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title={displayMode === 'grid' ? 'Vizualizare listă' : 'Vizualizare grilă'}
          >
            {displayMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
          </button>

          {/* Export Button */}
          <Button variant="outline" onClick={exportToICal}>
            <Download size={18} className="mr-2" />
            Export iCal
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      {displayMode === 'grid' && viewMode === 'day' ? renderDayView() : renderListView()}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Detalii Rezervare</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600">Client</p>
                  <p className="font-medium">{selectedBooking.user?.name}</p>
                  <p className="text-sm text-slate-500">{selectedBooking.user?.phone}</p>
                  <p className="text-sm text-slate-500">{selectedBooking.user?.email}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-600">Serviciu</p>
                  <p className="font-medium">{selectedBooking.service?.name}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(selectedBooking.date).toLocaleDateString('ro-RO', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })} • {selectedBooking.time}
                  </p>
                  <p className="text-sm text-slate-500">
                    Durată: {selectedBooking.service?.duration} minute
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-600">Preț</p>
                  <p className="font-semibold text-amber-600 text-lg">
                    {formatPrice(selectedBooking.total_price)}
                  </p>
                </div>

                {selectedBooking.notes && (
                  <div>
                    <p className="text-sm text-slate-600">Note</p>
                    <p className="text-sm">{selectedBooking.notes}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-slate-600 mb-2">Status</p>
                  <div className="flex gap-2">
                    {(['pending', 'confirmed', 'completed', 'cancelled'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedBooking.id, status)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedBooking.status === status
                            ? getStatusColor(status)
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {status === 'pending' ? 'În așteptare' :
                         status === 'confirmed' ? 'Confirmat' :
                         status === 'completed' ? 'Finalizat' : 'Anulat'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="ghost" onClick={() => setSelectedBooking(null)} className="flex-1">
                  Închide
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};