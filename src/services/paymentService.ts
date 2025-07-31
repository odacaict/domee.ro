import { supabase } from '../lib/supabase';
import { Payment } from '../types';
import { apiClient, handleApiError } from './api';

interface StripePaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
}

interface CryptoPaymentData {
  walletAddress: string;
  amount: number;
  currency: string;
  qrCode: string;
  paymentId: string;
}

export const paymentService = {
  // Create Stripe payment intent
  async createStripePayment(bookingId: string, amount: number): Promise<StripePaymentIntent> {
    try {
      // In production, this would call your backend API that interfaces with Stripe
      // For now, we'll simulate the response
      const response = await fetch('/api/payments/stripe/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, amount }),
      });

      if (!response.ok) throw new Error('Failed to create payment intent');
      
      return await response.json();
    } catch (error) {
      handleApiError(error);
      // Fallback for development
      return {
        clientSecret: `pi_test_${Date.now()}_secret`,
        paymentIntentId: `pi_test_${Date.now()}`,
      };
    }
  },

  // Create crypto payment
  async createCryptoPayment(bookingId: string, amount: number, currency: string = 'BTC'): Promise<CryptoPaymentData> {
    try {
      const { data: provider } = await supabase
        .from('bookings')
        .select('provider:providers(crypto_wallets)')
        .eq('id', bookingId)
        .single();

      if (!provider?.provider?.crypto_wallets?.length) {
        throw new Error('Provider does not accept crypto payments');
      }

      // Get provider's wallet for the selected currency
      const walletAddress = provider.provider.crypto_wallets[0]; // In production, filter by currency

      // Generate QR code data
      const qrData = `bitcoin:${walletAddress}?amount=${amount}`;

      // Create payment record
      const payment = await apiClient.create<Payment>('payments', {
        booking_id: bookingId,
        amount,
        method: 'crypto',
        crypto_currency: currency,
        status: 'pending',
        transaction_id: `crypto_${Date.now()}`,
      });

      return {
        walletAddress,
        amount,
        currency,
        qrCode: qrData,
        paymentId: payment.id,
      };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Confirm Stripe payment
  async confirmStripePayment(paymentIntentId: string): Promise<Payment> {
    try {
      // In production, verify with Stripe API
      const response = await fetch('/api/payments/stripe/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId }),
      });

      if (!response.ok) throw new Error('Failed to confirm payment');
      
      return await response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Verify crypto payment
  async verifyCryptoPayment(paymentId: string, transactionHash: string): Promise<boolean> {
    try {
      // In production, verify on blockchain
      // For now, simulate verification
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'completed',
          transaction_id: transactionHash,
        })
        .eq('id', paymentId);

      if (error) throw error;

      // Update booking payment status
      const { data: payment } = await supabase
        .from('payments')
        .select('booking_id')
        .eq('id', paymentId)
        .single();

      if (payment) {
        await supabase
          .from('bookings')
          .update({ payment_status: 'paid' })
          .eq('id', payment.booking_id);
      }

      return true;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get payment by booking ID
  async getPaymentByBookingId(bookingId: string): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('booking_id', bookingId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as Payment | null;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Process refund
  async processRefund(paymentId: string, reason?: string): Promise<Payment> {
    try {
      const { data: payment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error) throw error;
      if (!payment) throw new Error('Payment not found');

      // In production, process refund through payment gateway
      // Update payment status
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({ status: 'refunded' })
        .eq('id', paymentId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update booking payment status
      await supabase
        .from('bookings')
        .update({ payment_status: 'refunded' })
        .eq('id', payment.booking_id);

      return updatedPayment as Payment;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Calculate platform fee
  calculatePlatformFee(amount: number): number {
    const PLATFORM_FEE_PERCENTAGE = 0.05; // 5%
    return Math.round(amount * PLATFORM_FEE_PERCENTAGE * 100) / 100;
  },

  // Calculate provider payout
  calculateProviderPayout(amount: number): number {
    const platformFee = this.calculatePlatformFee(amount);
    return amount - platformFee;
  },

  // Generate payment QR code
  generateQRCode(data: string): string {
    // In production, use a QR code library
    // For now, return a placeholder URL
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;
  },
};