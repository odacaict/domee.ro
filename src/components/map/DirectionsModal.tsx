import React, { useState, useEffect } from 'react';
import { X, Car, Navigation, Clock, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';

interface DirectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  providerName: string;
  providerAddress: string;
}

interface DirectionStep {
  instruction: string;
  distance: string;
  duration: string;
}

interface DirectionResult {
  distance: string;
  duration: string;
  steps: DirectionStep[];
}

export const DirectionsModal: React.FC<DirectionsModalProps> = ({
  isOpen,
  onClose,
  origin,
  destination,
  providerName,
  providerAddress,
}) => {
  const [directions, setDirections] = useState<DirectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<'DRIVING' | 'WALKING' | 'TRANSIT'>('DRIVING');

  useEffect(() => {
    if (isOpen) {
      fetchDirections();
    }
  }, [isOpen, travelMode]);

  const fetchDirections = async () => {
    if (!window.google) return;

    setLoading(true);
    setError(null);

    try {
      const directionsService = new window.google.maps.DirectionsService();
      
      const request = {
        origin: new window.google.maps.LatLng(origin.lat, origin.lng),
        destination: new window.google.maps.LatLng(destination.lat, destination.lng),
        travelMode: window.google.maps.TravelMode[travelMode],
        unitSystem: window.google.maps.UnitSystem.METRIC,
        language: 'ro',
      };

      directionsService.route(request, (result: any, status: any) => {
        if (status === 'OK' && result.routes[0]) {
          const route = result.routes[0].legs[0];
          
          const steps: DirectionStep[] = route.steps.map((step: any) => ({
            instruction: step.instructions.replace(/<[^>]*>?/gm, ''), // Remove HTML tags
            distance: step.distance.text,
            duration: step.duration.text,
          }));

          setDirections({
            distance: route.distance.text,
            duration: route.duration.text,
            steps,
          });
        } else {
          setError('Nu s-a putut calcula ruta. Vă rugăm încercați din nou.');
        }
        setLoading(false);
      });
    } catch (err) {
      setError('Eroare la calcularea rutei');
      setLoading(false);
    }
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=${travelMode.toLowerCase()}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Direcții către</h2>
              <p className="text-slate-600 mt-1">{providerName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Travel Mode Selector */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex gap-2">
            {[
              { mode: 'DRIVING' as const, label: 'Mașină', icon: Car },
              { mode: 'WALKING' as const, label: 'Pe jos', icon: Navigation },
              { mode: 'TRANSIT' as const, label: 'Transport public', icon: MapPin },
            ].map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setTravelMode(mode)}
                className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  travelMode === mode
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchDirections} variant="outline">
                Încearcă din nou
              </Button>
            </div>
          ) : directions ? (
            <div>
              {/* Summary */}
              <div className="bg-amber-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-amber-700">
                    <Clock size={20} />
                    <span className="font-semibold text-lg">{directions.duration}</span>
                  </div>
                  <div className="text-slate-600">
                    <span className="font-medium">{directions.distance}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600">{providerAddress}</p>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-800 mb-2">Pași de urmat:</h3>
                {directions.steps.map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-medium text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-700">{step.instruction}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {step.distance} • {step.duration}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200">
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="flex-1">
              Închide
            </Button>
            <Button onClick={openInGoogleMaps} className="flex-1">
              <Navigation size={18} className="mr-2" />
              Deschide în Google Maps
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};