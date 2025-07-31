import React, { useState } from 'react';
import { Calendar, Clock, ChevronLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Provider, Service, Booking } from '../../types';
import { formatPrice, formatDuration, cn } from '../../lib/utils';
import { PaymentModal } from '../payment/PaymentModal';
import { useApp } from '../../contexts/AppContext';
import { bookingService } from '../../services/bookingService';

interface BookingCalendarProps {
  provider: Provider;
  service: Service;
  onBack: () => void;
  onConfirm: (date: Date, time: string) => void;
}

type TimeSlot = {
  time: string;
  available: boolean;
};

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  provider,
  service,
  onBack,
  onConfirm,
}) => {
  const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow' | 'other'>('today');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState<Date>(new Date());
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newBooking, setNewBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useApp();

  // Generate time slots from 08:00 to 23:30
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 8; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 23 && minute === 30) continue; // Skip 23:30
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        // Mock availability - randomly make some slots unavailable
        const available = Math.random() > 0.3;
        slots.push({ time, available });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const getDisplayDate = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (selectedDate) {
      case 'today':
        return today;
      case 'tomorrow':
        return tomorrow;
      case 'other':
        return customDate;
      default:
        return today;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirm = async () => {
    if (!selectedTime || !isAuthenticated || !user) {
      alert('Vă rugăm să vă autentificați pentru a face o rezervare');
      return;
    }

    setLoading(true);
    try {
      const bookingDate = getDisplayDate();
      const booking = await bookingService.createBooking({
        user_id: user.id,
        provider_id: provider.id,
        service_id: service.id,
        date: bookingDate.toISOString().split('T')[0],
        time: selectedTime,
        status: 'pending',
        total_price: service.price,
        payment_status: 'pending',
      });

      setNewBooking({
        ...booking,
        provider,
        service,
      } as Booking);
      setShowPaymentModal(true);
    } catch (error) {
      alert('Eroare la crearea rezervării. Vă rugăm încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    alert('Plata a fost procesată cu succes! Rezervarea dvs. a fost confirmată.');
    onConfirm(getDisplayDate(), selectedTime!);
  };

  const isAM = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    return hour < 12;
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4 p-4 border-b">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="font-bold text-lg text-slate-800">
                {provider.salon_name}
              </h1>
              <p className="text-sm text-slate-600">Calendar rezervări</p>
            </div>
          </div>
        </div>

        {/* Service Info */}
        <div className="bg-white mx-4 mt-4 rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-slate-800">{service.name}</h3>
              <p className="text-sm text-slate-600 mt-1">
                Durată: {formatDuration(service.duration)}
              </p>
            </div>
            <p className="font-bold text-amber-600 text-lg">
              {formatPrice(service.price)}
            </p>
          </div>
        </div>

        {/* Date Selection */}
        <div className="mx-4 mt-6">
          <div className="flex gap-3 mb-6">
            <Button
              variant={selectedDate === 'today' ? 'primary' : 'outline'}
              onClick={() => setSelectedDate('today')}
              className="flex-1"
            >
              Azi
            </Button>
            <Button
              variant={selectedDate === 'tomorrow' ? 'primary' : 'outline'}
              onClick={() => setSelectedDate('tomorrow')}
              className="flex-1"
            >
              Mâine
            </Button>
            <Button
              variant={selectedDate === 'other' ? 'primary' : 'outline'}
              onClick={() => setSelectedDate('other')}
              className="flex-1"
            >
              Altă dată
            </Button>
          </div>

          {selectedDate === 'other' && (
            <div className="mb-6">
              <input
                type="date"
                value={customDate.toISOString().split('T')[0]}
                onChange={(e) => setCustomDate(new Date(e.target.value))}
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-amber-500 focus:outline-none"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4 text-center">
              <Calendar size={20} className="text-amber-600" />
              <span className="font-medium text-slate-800">
                {formatDate(getDisplayDate())}
              </span>
            </div>

            {/* AM Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-700 mb-3">AM</h4>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.filter(slot => isAM(slot.time)).map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && handleTimeSelect(slot.time)}
                    disabled={!slot.available}
                    className={cn(
                      "p-3 rounded-lg text-sm font-medium transition-all",
                      slot.available
                        ? selectedTime === slot.time
                          ? "bg-amber-600 text-white"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        : "bg-red-100 text-red-700 cursor-not-allowed opacity-75"
                    )}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>

            {/* PM Section */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3">PM</h4>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.filter(slot => !isAM(slot.time)).map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && handleTimeSelect(slot.time)}
                    disabled={!slot.available}
                    className={cn(
                      "p-3 rounded-lg text-sm font-medium transition-all",
                      slot.available
                        ? selectedTime === slot.time
                          ? "bg-amber-600 text-white"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        : "bg-red-100 text-red-700 cursor-not-allowed opacity-75"
                    )}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 bg-white rounded-xl p-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-100 rounded"></div>
              <span className="text-sm text-slate-600">Disponibil</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-100 rounded"></div>
              <span className="text-sm text-slate-600">Indisponibil</span>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="mt-6 mb-8">
            <Button
              onClick={handleConfirm}
              disabled={!selectedTime || loading}
              variant="success"
              size="lg"
              className="w-full font-semibold"
              loading={loading}
            >
              {selectedTime 
                ? `Confirmă rezervarea pentru ${selectedTime}`
                : 'Selectează o oră pentru a continua'
              }
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {newBooking && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          booking={newBooking}
          provider={provider}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};