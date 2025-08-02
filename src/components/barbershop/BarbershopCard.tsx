import React from 'react';
import { MapPin, Star as StarIcon, Clock, Verified, Map, Shield, Bitcoin, CreditCard, Heart } from 'lucide-react';
import { Button } from '../ui/Button';
import { Provider } from '../../types';
import { formatPrice, formatDistance } from '../../lib/utils';
import { mapHelpers } from '../../utils/mapHelpers';

interface BarbershopCardProps {
  provider: Provider;
  onBook: (provider: Provider) => void;
  onViewMap: (provider: Provider) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export const BarbershopCard: React.FC<BarbershopCardProps> = ({
  provider,
  onBook,
  onViewMap,
  userLocation,
}) => {
  const isOpenNow = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const workingHours = provider.working_hours?.[dayOfWeek];
    if (!workingHours || !workingHours.open) return false;
    
    const openTime = workingHours.open_time;
    const closeTime = workingHours.close_time;
    
    if (!openTime || !closeTime) return false;
    
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);
    
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    
    return currentTime >= openMinutes && currentTime <= closeMinutes;
  };

  const getMinPrice = () => {
    if (!provider.services || provider.services.length === 0) return 0;
    return Math.min(...provider.services.map(s => s.price));
  };

  // Funcție pentru calcularea distanței de la utilizator la salon
  const calculateDistanceToUser = () => {
    if (!userLocation || !provider.coordinates) return null;
    
    // Verifică dacă coordonatele provider-ului sunt valide
    let providerCoords = null;
    
    // Format 1: coordinates obiect direct
    if (provider.coordinates && typeof provider.coordinates === 'object' && 
        typeof provider.coordinates.lat === 'number' && typeof provider.coordinates.lng === 'number') {
      providerCoords = provider.coordinates;
    }
    // Format 2: location GEOGRAPHY din baza de date
    else if (provider.location) {
      try {
        if (typeof provider.location === 'string') {
          const parsed = JSON.parse(provider.location);
          if (parsed.coordinates && Array.isArray(parsed.coordinates) && parsed.coordinates.length === 2) {
            providerCoords = { lat: parsed.coordinates[1], lng: parsed.coordinates[0] };
          }
        } else if (typeof provider.location === 'object' && provider.location.coordinates) {
          if (Array.isArray(provider.location.coordinates) && provider.location.coordinates.length === 2) {
            providerCoords = { lat: provider.location.coordinates[1], lng: provider.location.coordinates[0] };
          }
        }
      } catch (error) {
        console.warn('Eroare la parsarea location pentru distanță:', error);
      }
    }
    
    if (!providerCoords) return null;
    
    return mapHelpers.calculateDistance(userLocation, providerCoords);
  };

  // Funcție pentru a obține cea mai bună imagine disponibilă
  const getBestImage = () => {
    // 1. Încearcă imaginea principală
    if (provider.featured_image) {
      return provider.featured_image;
    }
    
    // 2. Încearcă prima imagine din galerie
    if (provider.images && provider.images.length > 0) {
      return provider.images[0];
    }
    
    // 3. NOU: Încearcă logo-ul ca imagine principală
    if (provider.logo_url) {
      return provider.logo_url;
    }
    
    // 4. Fallback la imagine standard (doar dacă nu există logo)
    return 'https://images.pexels.com/photos/1570807/pexels-photo-1570807.jpeg?auto=compress&cs=tinysrgb&w=600';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={getBestImage()}
          alt={provider.salon_name}
          className="w-full h-48 object-cover"
        />
        
        {/* Logo Overlay */}
        {provider.logo_url && (
          <div className="absolute top-3 left-3 w-12 h-12 bg-white rounded-full shadow-lg p-1">
            <img
              src={provider.logo_url}
              alt={`${provider.salon_name} logo`}
              className="w-full h-full object-contain rounded-full"
            />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          {provider.verified ? (
            <div className="bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Verified size={12} />
              Verificat
            </div>
          ) : (
            <div className="bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Shield size={12} />
              Nou
            </div>
          )}
        </div>

        {/* Open/Closed Status */}
        <div className="absolute bottom-3 right-3">
          <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
            isOpenNow() 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <Clock size={12} />
            {isOpenNow() ? 'Deschis' : 'Închis'}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Salon Info */}
        <div className="mb-3">
          <h3 className="font-bold text-slate-800 text-lg mb-1">
            {provider.salon_name}
          </h3>
          <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
            {provider.description}
          </p>
        </div>

        {/* Rating and Reviews */}
        <div className="flex items-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Heart
              key={star}
              size={16}
              className={`${
                star <= Math.round(provider.rating)
                  ? 'text-amber-400 fill-current'
                  : 'text-slate-300'
              }`}
            />
          ))}
          <span className="ml-2 font-medium text-slate-700">
            {provider.rating.toFixed(1)}
          </span>
          <span className="text-slate-500 text-sm">
            ({provider.review_count} {provider.review_count === 1 ? 'recenzie' : 'recenzii'})
          </span>
        </div>

        {/* Distance */}
        {(() => {
          const calculatedDistance = calculateDistanceToUser();
          const displayDistance = calculatedDistance !== null ? calculatedDistance : provider.distance;
          
          if (displayDistance !== undefined && displayDistance !== null) {
            return (
              <div className="flex items-center gap-1 mb-3 text-sm text-slate-500">
                <MapPin size={14} />
                <span>{formatDistance(displayDistance)}</span>
              </div>
            );
          }
          return null;
        })()}

        {/* Payment Methods */}
        <div className="flex items-center gap-1 mb-3">
          {provider.payment_methods?.fiat && (
            <CreditCard size={14} className="text-slate-400" title="Acceptă card" />
          )}
          {provider.payment_methods?.crypto && (
            <Bitcoin size={14} className="text-amber-600" title="Acceptă crypto" />
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-slate-600 text-sm">
            Începând de la: <span className="font-bold text-amber-600 text-lg">{formatPrice(getMinPrice())}</span>
          </div>
          
          {/* Facilities Preview */}
          {provider.facilities && provider.facilities.length > 0 && (
            <div className="flex gap-1">
              {provider.facilities.slice(0, 3).map((facility, index) => (
                <span
                  key={index}
                  className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full"
                >
                  {facility === 'wifi' ? 'WiFi' :
                   facility === 'parking' ? 'Parcare' :
                   facility === 'air_conditioning' ? 'AC' : facility}
                </span>
              ))}
              {provider.facilities.length > 3 && (
                <span className="text-xs text-slate-500">
                  +{provider.facilities.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => onBook(provider)}
            variant="success"
            className="flex-1 font-semibold"
          >
            Rezervă Acum
          </Button>
          <Button
            onClick={() => onViewMap(provider)}
            variant="outline"
            className="px-4"
            title="Vezi pe hartă"
          >
            <Map size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};