import { supabase } from '../lib/supabase';
import { Booking } from '../types';
import { apiClient, handleApiError } from './api';

export const bookingService = {
  async createBooking(bookingData: Partial<Booking>): Promise<Booking> {
    return apiClient.create('bookings', bookingData);
  },

  async getBookingById(id: string): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        provider:providers(*),
        service:services(*),
        user:users(*)
      `)
      .eq('id', id)
      .single();

    if (error) handleApiError(error);
    return data as Booking;
  },

  async getUserBookings(userId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        provider:providers(*),
        service:services(*)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) handleApiError(error);
    return data as Booking[];
  },

  async getProviderBookings(providerId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        user:users(*),
        service:services(*)
      `)
      .eq('provider_id', providerId)
      .order('date', { ascending: false });

    if (error) handleApiError(error);
    return data as Booking[];
  },

  async updateBookingStatus(id: string, status: Booking['status']): Promise<Booking> {
    return apiClient.update('bookings', id, { status });
  },

  async cancelBooking(id: string): Promise<Booking> {
    return this.updateBookingStatus(id, 'cancelled');
  },

  async getAvailableSlots(providerId: string, serviceId: string, date: string): Promise<string[]> {
    // Get provider working hours
    const { data: provider } = await supabase
      .from('providers')
      .select('working_hours')
      .eq('id', providerId)
      .single();

    if (!provider) return [];

    // Get existing bookings for the date
    const { data: bookings } = await supabase
      .from('bookings')
      .select('time, services(duration)')
      .eq('provider_id', providerId)
      .eq('date', date)
      .neq('status', 'cancelled');

    // Get service duration
    const { data: service } = await supabase
      .from('services')
      .select('duration')
      .eq('id', serviceId)
      .single();

    if (!service) return [];

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
    const workingHours = provider.working_hours[dayOfWeek];

    if (!workingHours || workingHours.closed) return [];

    // Generate all possible time slots
    const slots: string[] = [];
    const openTime = this.timeToMinutes(workingHours.open);
    const closeTime = this.timeToMinutes(workingHours.close);
    const serviceDuration = service.duration;

    for (let time = openTime; time + serviceDuration <= closeTime; time += 30) {
      const slot = this.minutesToTime(time);
      
      // Check if slot conflicts with existing bookings
      const isAvailable = !bookings?.some(booking => {
        const bookingStart = this.timeToMinutes(booking.time);
        const bookingEnd = bookingStart + (booking.services?.duration || 30);
        const slotEnd = time + serviceDuration;
        
        return (time >= bookingStart && time < bookingEnd) ||
               (slotEnd > bookingStart && slotEnd <= bookingEnd);
      });

      if (isAvailable) {
        slots.push(slot);
      }
    }

    return slots;
  },

  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  },

  minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  },
};
