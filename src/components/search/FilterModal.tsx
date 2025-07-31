import React, { useState } from 'react';
import { X, Star as StarIcon, MapPin, DollarSign, Users, Bitcoin, Globe, Sparkles, Shield, Languages } from 'lucide-react';
import { Button } from '../ui/Button';
import { FilterCriteria } from '../../types';
import { cn } from '../../lib/utils';
import { Checkbox } from '../ui/Checkbox';
import { FACILITIES_OPTIONS, LANGUAGES, ROMANIA_CITIES, PRICE_RANGES } from '../../utils/constants';

interface ExtendedFilterCriteria extends FilterCriteria {
  city?: string;
  minRating?: number;
  priceMin?: number;
  priceMax?: number;
  facilities?: string[];
  languages?: string[];
  verified?: boolean;
  hasPromotions?: boolean;
  availableNow?: boolean;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: ExtendedFilterCriteria) => void;
  currentFilters?: ExtendedFilterCriteria;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters = {}
}) => {
  const [filters, setFilters] = useState<ExtendedFilterCriteria>(currentFilters);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
  };

  if (!isOpen) return null;

  const facilityLabels: Record<string, string> = {
    wifi: 'Wi-Fi Gratuit',
    parking: 'Parcare',
    card_payment: 'Plată cu Cardul',
    crypto_payment: 'Plată Crypto',
    air_conditioning: 'Aer Condiționat',
    wheelchair_access: 'Acces Persoane cu Dizabilități',
    kids_friendly: 'Prietenos cu Copiii',
    pets_allowed: 'Animale Permise',
    online_booking: 'Rezervare Online',
    loyalty_program: 'Program de Loialitate',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Filtrare Rezultate</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Filter Sections */}
          <div className="space-y-6">
            {/* Location Filter */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={20} className="text-amber-600" />
                <h3 className="font-semibold text-slate-800">Locație</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <button
                  onClick={() => setFilters({ ...filters, city: undefined })}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all font-medium',
                    !filters.city
                      ? 'border-amber-600 bg-amber-50 text-amber-700'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  Toate
                </button>
                {['București', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța'].map((city) => (
                  <button
                    key={city}
                    onClick={() => setFilters({ ...filters, city })}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all font-medium',
                      filters.city === city
                        ? 'border-amber-600 bg-amber-50 text-amber-700'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {city}
                  </button>
                ))}
                <select
                  value={filters.city || ''}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value || undefined })}
                  className="p-3 rounded-lg border-2 border-slate-200 focus:border-amber-600 focus:outline-none"
                >
                  <option value="">Alt oraș...</option>
                  {ROMANIA_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Distance Filter */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={20} className="text-amber-600" />
                <h3 className="font-semibold text-slate-800">Distanță Maximă</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 5, 10, 20, 50].map((km) => (
                  <button
                    key={km}
                    onClick={() => setFilters({ ...filters, maxDistance: km })}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all font-medium',
                      filters.maxDistance === km
                        ? 'border-amber-600 bg-amber-50 text-amber-700'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {km} km
                  </button>
                ))}
                <button
                  onClick={() => setFilters({ ...filters, maxDistance: undefined })}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all font-medium',
                    !filters.maxDistance
                      ? 'border-amber-600 bg-amber-50 text-amber-700'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  Oriunde
                </button>
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <StarIcon size={20} className="text-amber-600" />
                <h3 className="font-semibold text-slate-800">Rating Minim</h3>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[0, 3, 3.5, 4, 4.5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFilters({ ...filters, minRating: rating || undefined })}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all font-medium flex items-center justify-center gap-1',
                      filters.minRating === rating
                        ? 'border-amber-600 bg-amber-50 text-amber-700'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {rating === 0 ? 'Toate' : (
                      <>
                        <StarIcon size={14} className="fill-current" />
                        {rating}+
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={20} className="text-amber-600" />
                <h3 className="font-semibold text-slate-800">Interval Preț (lei)</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Minim</label>
                  <input
                    type="number"
                    value={filters.priceMin || ''}
                    onChange={(e) => setFilters({ ...filters, priceMin: Number(e.target.value) || undefined })}
                    placeholder="0"
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Maxim</label>
                  <input
                    type="number"
                    value={filters.priceMax || ''}
                    onChange={(e) => setFilters({ ...filters, priceMax: Number(e.target.value) || undefined })}
                    placeholder="500"
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {Object.entries(PRICE_RANGES).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setFilters({ ...filters, priceOrder: filters.priceOrder === 'asc' ? 'desc' : 'asc' })}
                    className={cn(
                      'p-2 rounded-lg border-2 transition-all text-sm',
                      'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {value === 'low' ? '€' : value === 'medium' ? '€€' : '€€€'}
                  </button>
                ))}
              </div>
            </div>

            {/* Salon Type */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users size={20} className="text-amber-600" />
                <h3 className="font-semibold text-slate-800">Tipul Salonului</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setFilters({ ...filters, salonType: undefined })}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all font-medium',
                    !filters.salonType
                      ? 'border-amber-600 bg-amber-50 text-amber-700'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  Toate
                </button>
                <button
                  onClick={() => setFilters({ ...filters, salonType: 'women' })}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all font-medium',
                    filters.salonType === 'women'
                      ? 'border-amber-600 bg-amber-50 text-amber-700'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  Femei
                </button>
                <button
                  onClick={() => setFilters({ ...filters, salonType: 'men' })}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all font-medium',
                    filters.salonType === 'men'
                      ? 'border-amber-600 bg-amber-50 text-amber-700'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  Bărbați
                </button>
                <button
                  onClick={() => setFilters({ ...filters, salonType: 'unisex' })}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all font-medium col-span-3',
                    filters.salonType === 'unisex'
                      ? 'border-amber-600 bg-amber-50 text-amber-700'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  Unisex
                </button>
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bitcoin size={20} className="text-amber-600" />
                <h3 className="font-semibold text-slate-800">Metode de Plată</h3>
              </div>
              <div className="space-y-2">
                <Checkbox
                  id="crypto-payment"
                  checked={filters.paymentMethods?.crypto || false}
                  onChange={(checked) => setFilters({
                    ...filters,
                    paymentMethods: {
                      ...filters.paymentMethods,
                      crypto: checked
                    }
                  })}
                  label="Acceptă Crypto"
                />
                <Checkbox
                  id="fiat-payment"
                  checked={filters.paymentMethods?.fiat || false}
                  onChange={(checked) => setFilters({
                    ...filters,
                    paymentMethods: {
                      ...filters.paymentMethods,
                      fiat: checked
                    }
                  })}
                  label="Acceptă Card/Numerar"
                />
              </div>
            </div>

            {/* Facilities */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={20} className="text-amber-600" />
                <h3 className="font-semibold text-slate-800">Facilități</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {FACILITIES_OPTIONS.map((facility) => (
                  <Checkbox
                    key={facility}
                    id={`facility-${facility}`}
                    checked={filters.facilities?.includes(facility) || false}
                    onChange={(checked) => {
                      const facilities = filters.facilities || [];
                      setFilters({
                        ...filters,
                        facilities: checked
                          ? [...facilities, facility]
                          : facilities.filter(f => f !== facility)
                      });
                    }}
                    label={facilityLabels[facility]}
                  />
                ))}
              </div>
            </div>

            {/* Languages */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Languages size={20} className="text-amber-600" />
                <h3 className="font-semibold text-slate-800">Limbi Vorbite</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(LANGUAGES).map(([code, name]) => (
                  <Checkbox
                    key={code}
                    id={`language-${code}`}
                    checked={filters.languages?.includes(code) || false}
                    onChange={(checked) => {
                      const languages = filters.languages || [];
                      setFilters({
                        ...filters,
                        languages: checked
                          ? [...languages, code]
                          : languages.filter(l => l !== code)
                      });
                    }}
                    label={name}
                  />
                ))}
              </div>
            </div>

            {/* Additional Filters */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={20} className="text-amber-600" />
                <h3 className="font-semibold text-slate-800">Altele</h3>
              </div>
              <div className="space-y-2">
                <Checkbox
                  id="verified-only"
                  checked={filters.verified || false}
                  onChange={(checked) => setFilters({ ...filters, verified: checked })}
                  label="Doar Saloane Verificate"
                />
                <Checkbox
                  id="has-promotions"
                  checked={filters.hasPromotions || false}
                  onChange={(checked) => setFilters({ ...filters, hasPromotions: checked })}
                  label="Cu Promoții Active"
                />
                <Checkbox
                  id="available-now"
                  checked={filters.availableNow || false}
                  onChange={(checked) => setFilters({ ...filters, availableNow: checked })}
                  label="Disponibil Acum"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            <Button
              variant="ghost"
              onClick={handleReset}
              className="flex-1"
            >
              Resetează
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1"
            >
              Aplică Filtre
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};