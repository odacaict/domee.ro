import { useState, useEffect } from 'react';
import { Payment } from '../types';
import { paymentService } from '../services/paymentService';

export function usePayments(bookingId?: string) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId) {
      fetchPayment();
    }
  }, [bookingId]);

  const fetchPayment = async () => {
    if (!bookingId) return;

    try {
      setLoading(true);
      const data = await paymentService.getPaymentByBookingId(bookingId);
      setPayment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment');
    } finally {
      setLoading(false);
    }
  };

  const createStripePayment = async (amount: number) => {
    if (!bookingId) throw new Error('Booking ID required');

    try {
      setLoading(true);
      const paymentIntent = await paymentService.createStripePayment(bookingId, amount);
      return paymentIntent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createCryptoPayment = async (amount: number, currency: string = 'BTC') => {
    if (!bookingId) throw new Error('Booking ID required');

    try {
      setLoading(true);
      const cryptoData = await paymentService.createCryptoPayment(bookingId, amount, currency);
      return cryptoData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create crypto payment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (paymentIntentId: string) => {
    try {
      setLoading(true);
      const confirmedPayment = await paymentService.confirmStripePayment(paymentIntentId);
      setPayment(confirmedPayment);
      return confirmedPayment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm payment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyCryptoPayment = async (paymentId: string, transactionHash: string) => {
    try {
      setLoading(true);
      const verified = await paymentService.verifyCryptoPayment(paymentId, transactionHash);
      if (verified && bookingId) {
        await fetchPayment(); // Refresh payment data
      }
      return verified;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify payment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const processRefund = async () => {
    if (!payment) throw new Error('No payment to refund');

    try {
      setLoading(true);
      const refundedPayment = await paymentService.processRefund(payment.id);
      setPayment(refundedPayment);
      return refundedPayment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process refund');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    payment,
    loading,
    error,
    createStripePayment,
    createCryptoPayment,
    confirmPayment,
    verifyCryptoPayment,
    processRefund,
    refresh: fetchPayment,
  };
}