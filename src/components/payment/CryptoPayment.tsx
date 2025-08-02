import React, { useState, useEffect } from 'react';
import { Bitcoin, Copy, Check, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Provider } from '../../types';

interface CryptoPaymentProps {
  bookingId: string;
  amount: number;
  provider: Provider;
  onSuccess: () => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

type CryptoCurrency = 'BTC' | 'ETH' | 'USDT';

export const CryptoPayment: React.FC<CryptoPaymentProps> = ({
  bookingId,
  amount,
  provider,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<CryptoCurrency>('BTC');
  const [paymentData, setPaymentData] = useState<{
    walletAddress: string;
    amount: number;
    qrCode: string;
  } | null>(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds

  useEffect(() => {
    if (paymentData && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, paymentData]);

  const getProviderWallet = (currency: CryptoCurrency): string => {
    const wallets = provider.payment_methods?.crypto_wallets || [];
    const wallet = wallets.find(w => w.currency === currency);
    return wallet?.address || '';
  };

  const isValidWallet = (address: string, currency: CryptoCurrency): boolean => {
    if (!address) return false;
    
    switch (currency) {
      case 'BTC':
        return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address);
      case 'ETH':
      case 'USDT':
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      default:
        return false;
    }
  };

  const generateQRCode = (address: string, amount: string, currency: CryptoCurrency): string => {
    const qrData = `${currency.toLowerCase()}:${address}?amount=${amount}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  };

  const handleGeneratePayment = () => {
    setIsProcessing(true);
    
    const walletAddress = getProviderWallet(selectedCurrency);
    
    if (!walletAddress) {
      onError(`Furnizorul nu a configurat wallet ${selectedCurrency}`);
      setIsProcessing(false);
      return;
    }

    if (!isValidWallet(walletAddress, selectedCurrency)) {
      onError(`Adresa wallet ${selectedCurrency} este invalidă`);
      setIsProcessing(false);
      return;
    }

    const cryptoAmount = convertAmount(amount, selectedCurrency);
    const qrCode = generateQRCode(walletAddress, cryptoAmount, selectedCurrency);

    setPaymentData({
      walletAddress,
      amount: parseFloat(cryptoAmount),
      qrCode,
    });
    
    setIsProcessing(false);
  };

  const handleCopyAddress = () => {
    if (paymentData) {
      navigator.clipboard.writeText(paymentData.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isValidTransactionHash = (hash: string, currency: CryptoCurrency): boolean => {
    if (!hash) return false;
    
    switch (currency) {
      case 'BTC':
        return /^[a-fA-F0-9]{64}$/.test(hash);
      case 'ETH':
      case 'USDT':
        return /^0x[a-fA-F0-9]{64}$/.test(hash);
      default:
        return false;
    }
  };

  const handleVerifyPayment = () => {
    if (!paymentData || !transactionHash) {
      onError('Vă rugăm introduceți hash-ul tranzacției');
      return;
    }

    if (!isValidTransactionHash(transactionHash, selectedCurrency)) {
      onError(`Hash-ul tranzacției ${selectedCurrency} este invalid`);
      return;
    }

    setIsProcessing(true);
    
    // Simulare verificare - în realitate ar trebui să se facă o verificare reală
    setTimeout(() => {
      onSuccess();
      setIsProcessing(false);
    }, 2000);
  };

  const getConversionRate = (currency: CryptoCurrency): number => {
    // In production, fetch real-time rates
    const rates = {
      BTC: 0.000025,
      ETH: 0.00035,
      USDT: 1,
    };
    return rates[currency];
  };

  const convertAmount = (lei: number, currency: CryptoCurrency): string => {
    const usdAmount = lei / 4.5; // Approximate LEI to USD
    const cryptoAmount = usdAmount * getConversionRate(currency);
    return cryptoAmount.toFixed(currency === 'BTC' ? 8 : 6);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!paymentData) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Alege criptomoneda
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['BTC', 'ETH', 'USDT'] as CryptoCurrency[]).map((currency) => (
              <button
                key={currency}
                onClick={() => setSelectedCurrency(currency)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedCurrency === currency
                    ? 'border-amber-600 bg-amber-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-medium">{currency}</p>
                <p className="text-xs text-slate-600 mt-1">
                  ≈ {convertAmount(amount, currency)} {currency}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Cum funcționează:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Selectați criptomoneda dorită</li>
            <li>Generați adresa și QR code-ul pentru plată</li>
            <li>Trimiteți suma exactă la adresa afișată</li>
            <li>Introduceți hash-ul tranzacției pentru verificare</li>
            <li>Rezervarea va fi confirmată după validare</li>
          </ol>
        </div>

        <Button
          onClick={handleGeneratePayment}
          variant="primary"
          className="w-full"
          size="lg"
          loading={isProcessing}
        >
          <Bitcoin size={20} className="mr-2" />
          Generează Adresă de Plată
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-amber-600" />
          <span className="text-sm font-medium text-amber-800">Timp rămas:</span>
        </div>
        <span className="font-mono font-bold text-amber-900">{formatTime(timeLeft)}</span>
      </div>

      {/* QR Code */}
      <div className="bg-white border-2 border-slate-200 rounded-xl p-4 text-center">
        <img
          src={paymentData.qrCode}
          alt="QR Code"
          className="mx-auto mb-4"
          style={{ width: '200px', height: '200px' }}
        />
        
        {/* Wallet Address */}
        <div className="bg-slate-50 rounded-lg p-3 mb-3">
          <p className="text-xs text-slate-600 mb-1">Adresă {selectedCurrency}:</p>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono break-all flex-1">
              {paymentData.walletAddress}
            </code>
            <button
              onClick={handleCopyAddress}
              className="p-2 hover:bg-slate-200 rounded transition-colors flex-shrink-0"
            >
              {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Amount */}
        <div className="bg-amber-50 rounded-lg p-3">
          <p className="text-xs text-slate-600 mb-1">Sumă de plătit:</p>
          <p className="font-mono font-bold text-lg">
            {convertAmount(amount, selectedCurrency)} {selectedCurrency}
          </p>
          <p className="text-xs text-slate-500 mt-1">≈ {amount} LEI</p>
        </div>
      </div>

      {/* Transaction Hash Input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Hash Tranzacție
        </label>
        <input
          type="text"
          value={transactionHash}
          onChange={(e) => setTransactionHash(e.target.value)}
          placeholder="Introduceți hash-ul după ce ați trimis plata"
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-20"
        />
      </div>

      {/* Warning */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-red-700">
          <strong>Important:</strong> Trimiteți exact suma afișată la adresa corectă. 
          Verificați de 3 ori adresa înainte de a trimite plata.
        </p>
      </div>

      {/* Verify Button */}
      <Button
        onClick={handleVerifyPayment}
        variant="success"
        className="w-full"
        size="lg"
        loading={isProcessing}
        disabled={!transactionHash || isProcessing}
      >
        Verifică Plata
      </Button>

      {/* Cancel Button */}
      <Button
        onClick={() => setPaymentData(null)}
        variant="ghost"
        className="w-full"
        disabled={isProcessing}
      >
        Anulează și Alege Altă Metodă
      </Button>
    </div>
  );
};