import React, { useState } from 'react';
import { X, CreditCard, Bitcoin, Shield, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { StripePayment } from './StripePayment';
import { CryptoPayment } from './CryptoPayment';
import { Booking, Provider } from '../../types';
import { formatPrice } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  provider: Provider;
  onSuccess: () => void;
}

type PaymentMethod = 'card' | 'crypto';

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  booking,
  provider,
  onSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePaymentSuccess = () => {
    setIsProcessing(false);
    onSuccess();
    onClose();
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setIsProcessing(false);
  };

  const platformFee = Math.round(booking.total_price * 0.05 * 100) / 100;
  const total = booking.total_price + platformFee;

  const canPayWithCard = provider.payment_methods?.fiat;
  const canPayWithCrypto = provider.payment_methods?.crypto && provider.payment_methods?.crypto_wallets?.length > 0;

  // If provider doesn't accept any payment method, show error
  if (!canPayWithCard && !canPayWithCrypto) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Eroare Plată</h2>
          <p className="text-slate-600 mb-6">
            Acest furnizor nu a configurat încă metodele de plată. 
            Vă rugăm să contactați direct salonul pentru rezervare.
          </p>
          <Button onClick={onClose} className="w-full">Închide</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Finalizare Plată</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              disabled={isProcessing}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Booking Summary */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-slate-800">Detalii Rezervare</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">{booking.service?.name}</span>
                <span className="font-medium">{formatPrice(booking.total_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Taxă platformă (5%)</span>
                <span className="font-medium">{formatPrice(platformFee)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-base">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-amber-600">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3">Alege metoda de plată</h3>
            <div className="space-y-3">
              {canPayWithCard && (
                <button
                  onClick={() => {
                    setPaymentMethod('card');
                    setError(null);
                  }}
                  disabled={isProcessing}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all",
                    paymentMethod === 'card'
                      ? "border-amber-600 bg-amber-50"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <CreditCard size={24} className={paymentMethod === 'card' ? 'text-amber-600' : 'text-slate-400'} />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-slate-800">Card Bancar</p>
                    <p className="text-sm text-slate-600">Visa, Mastercard, etc.</p>
                  </div>
                </button>
              )}

              {canPayWithCrypto && (
                <button
                  onClick={() => {
                    setPaymentMethod('crypto');
                    setError(null);
                  }}
                  disabled={isProcessing}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all",
                    paymentMethod === 'crypto'
                      ? "border-amber-600 bg-amber-50"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <Bitcoin size={24} className={paymentMethod === 'crypto' ? 'text-amber-600' : 'text-slate-400'} />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-slate-800">Criptomonedă</p>
                    <p className="text-sm text-slate-600">Bitcoin, Ethereum, etc.</p>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Payment Form */}
          <div className="border-t pt-6">
            {paymentMethod === 'card' ? (
              <StripePayment
                bookingId={booking.id}
                amount={total}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
              />
            ) : (
              <CryptoPayment
                bookingId={booking.id}
                amount={total}
                provider={provider}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
              />
            )}
          </div>

          {/* Security Notice */}
          <div className="bg-slate-50 rounded-lg p-4 flex items-start gap-3">
            <Shield size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-600">
              <p className="font-medium text-slate-700 mb-1">Plată Securizată</p>
              <p>
                Toate tranzacțiile sunt procesate securizat. 
                Datele tale sunt protejate folosind cele mai recente standarde de securitate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};