import { useState, useEffect } from 'react';
import { Booking } from '../types';
import { bookingService } from '../services/bookingService';

export function useBookings(userId?: string, providerId?: string) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        let data: Booking[] = [];
        
        if (userId) {
          data = await bookingService.getUserBookings(userId);
        } else if (providerId) {
          data = await bookingService.getProviderBookings(providerId);
        }
        
        setBookings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };

    if (userId || providerId) {
      fetchBookings();
    }
  }, [userId, providerId]);

  const createBooking = async (bookingData: Partial<Booking>) => {
    try {
      const newBooking = await bookingService.createBooking(bookingData);
      setBookings([newBooking, ...bookings]);
      return newBooking;
    } catch (err) {
      throw err;
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      await bookingService.cancelBooking(bookingId);
      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, status: 'cancelled' } : b
      ));
    } catch (err) {
      throw err;
    }
  };

  return {
    bookings,
    loading,
    error,
    createBooking,
    cancelBooking,
    refresh: () => {
      if (userId) {
        bookingService.getUserBookings(userId).then(setBookings);
      } else if (providerId) {
        bookingService.getProviderBookings(providerId).then(setBookings);
      }
    }
  };
}

export function useAvailableSlots(providerId: string, serviceId: string, date: string) {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!providerId || !serviceId || !date) return;

    const fetchSlots = async () => {
      try {
        setLoading(true);
        const availableSlots = await bookingService.getAvailableSlots(providerId, serviceId, date);
        setSlots(availableSlots);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch available slots');
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [providerId, serviceId, date]);

  return { slots, loading, error };
}