import React, { useState } from 'react';
import { CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { usePayments } from '../../hooks/usePayments';

interface StripePaymentProps {
  bookingId: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export const StripePayment: React.FC<StripePaymentProps> = ({
  bookingId,
  amount,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
}) => {
  const { createStripePayment, confirmPayment } = usePayments(bookingId);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    if (!cardData.number || cardData.number.replace(/\s/g, '').length !== 16) {
      newErrors.number = 'Număr card invalid';
    }
    if (!cardData.expiry || !cardData.expiry.match(/^\d{2}\/\d{2}$/)) {
      newErrors.expiry = 'Format invalid (MM/YY)';
    }
    if (!cardData.cvc || cardData.cvc.length < 3) {
      newErrors.cvc = 'CVC invalid';
    }
    if (!cardData.name) {
      newErrors.name = 'Nume obligatoriu';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsProcessing(true);
    setErrors({});

    try {
      // Create payment intent
      const paymentIntent = await createStripePayment(amount);

      // In production, this would use Stripe.js to confirm the payment
      // For now, we'll simulate the payment confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Confirm payment
      await confirmPayment(paymentIntent.paymentIntentId);

      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Eroare la procesarea plății');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          label="Număr Card"
          value={cardData.number}
          onChange={(e) => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
          placeholder="1234 5678 9012 3456"
          maxLength={19}
          error={errors.number}
          icon={<CreditCard size={18} className="text-slate-400" />}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Data Expirare"
          value={cardData.expiry}
          onChange={(e) => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
          placeholder="MM/YY"
          maxLength={5}
          error={errors.expiry}
        />
        <Input
          label="CVC"
          value={cardData.cvc}
          onChange={(e) => setCardData({ ...cardData, cvc: e.target.value.replace(/\D/g, '') })}
          placeholder="123"
          maxLength={4}
          error={errors.cvc}
        />
      </div>

      <Input
        label="Nume Titular"
        value={cardData.name}
        onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
        placeholder="Ion Popescu"
        error={errors.name}
      />

      {/* Test mode notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-700">
          <p className="font-medium mb-1">Mod Test</p>
          <p>Folosește cardul: 4242 4242 4242 4242</p>
          <p>Data expirare: orice dată viitoare</p>
          <p>CVC: orice 3 cifre</p>
        </div>
      </div>

      <Button
        type="submit"
        variant="success"
        className="w-full"
        size="lg"
        loading={isProcessing}
        disabled={isProcessing}
      >
        {isProcessing ? 'Se procesează...' : `Plătește ${amount} lei`}
      </Button>
    </form>
  );
};