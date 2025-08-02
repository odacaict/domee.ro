import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Layers } from 'lucide-react';
import { Button } from '../ui/Button';
import { Provider } from '../../types';
import { DirectionsModal } from './DirectionsModal';
import { formatDistance } from '../../lib/utils';

interface MapViewProps {
  providers: Provider[];
  userLocation?: { lat: number; lng: number };
  selectedProvider?: Provider;
  onProviderSelect: (provider: Provider) => void;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export const MapView: React.FC<MapViewProps> = ({
  providers,
  userLocation,
  selectedProvider,
  onProviderSelect,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [showDirections, setShowDirections] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    // Load Google Maps script
    if (!window.google || !window.google.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&callback=initMap&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      
      // Set callback before adding script
      window.initMap = () => {
        console.log('Google Maps script loaded successfully');
        initializeMap();
      };
      
      script.onerror = () => {
        console.error('Failed to load Google Maps script');
      };
      
      document.head.appendChild(script);
    } else {
      console.log('Google Maps already loaded');
      initializeMap();
    }

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current) {
      console.error('Map container nu este disponibil');
      return;
    }
    
    if (!window.google || !window.google.maps) {
      console.error('Google Maps nu este încărcat complet');
      return;
    }

    const defaultCenter = userLocation || { lat: 44.4268, lng: 26.1025 }; // București default
    
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: userLocation ? 13 : 12,
      mapTypeId: 'roadmap',
      styles: [
        {
          featureType: 'poi.business',
          stylers: [{ visibility: 'off' }],
        },
      ],
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: true,
    });

    setIsMapLoaded(true);

    // Add user location marker if available
    if (userLocation) {
      new window.google.maps.Marker({
        position: userLocation,
        map: mapInstanceRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: 'Locația ta',
        zIndex: 1000,
      });
    }
  };

  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create info window
    const infoWindow = new window.google.maps.InfoWindow();

    // Add provider markers - PINURI ROȘII
    providers.forEach((provider) => {
      console.log('Provider pentru hartă:', provider.salon_name, 'Coordonate:', provider.coordinates, 'Location:', provider.location);
      
      // Verifică și procesează coordonatele din diverse formate
      let coordinates = null;
      
      // Format 1: coordinates obiect direct (din RPC)
      if (provider.coordinates && typeof provider.coordinates === 'object' && 
          typeof provider.coordinates.lat === 'number' && typeof provider.coordinates.lng === 'number') {
        coordinates = provider.coordinates;
      }
      // Format 2: location GEOGRAPHY din baza de date (în cazul în care Supabase îl returnează ca string sau obiect)
      else if (provider.location) {
        try {
          // Încearcă să parseze location-ul dacă este string
          if (typeof provider.location === 'string') {
            const parsed = JSON.parse(provider.location);
            if (parsed.coordinates && Array.isArray(parsed.coordinates) && parsed.coordinates.length === 2) {
              coordinates = { lat: parsed.coordinates[1], lng: parsed.coordinates[0] }; // GeoJSON: [lng, lat]
            }
          }
          // Dacă location este deja obiect
          else if (typeof provider.location === 'object' && provider.location.coordinates) {
            if (Array.isArray(provider.location.coordinates) && provider.location.coordinates.length === 2) {
              coordinates = { lat: provider.location.coordinates[1], lng: provider.location.coordinates[0] }; // GeoJSON: [lng, lat]
            }
          }
        } catch (error) {
          console.warn('Eroare la parsarea location pentru', provider.salon_name, ':', error);
        }
      }
      
      if (!coordinates) {
        console.warn('Provider fără coordonate valide:', provider.salon_name, 'coordinates:', provider.coordinates, 'location:', provider.location);
        return;
      }

      const marker = new window.google.maps.Marker({
        position: { lat: coordinates.lat, lng: coordinates.lng },
        map: mapInstanceRef.current,
        title: provider.salon_name,
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="40" height="50" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 0C11.163 0 4 7.163 4 16C4 28 20 50 20 50S36 28 36 16C36 7.163 28.837 0 20 0Z" fill="#dc2626"/>
              <circle cx="20" cy="16" r="8" fill="white"/>
              <text x="20" y="21" text-anchor="middle" font-size="16" font-weight="bold" fill="#dc2626">S</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 50),
          anchor: new window.google.maps.Point(20, 50),
        },
      });

      marker.addListener('click', () => {
        const content = `
          <div style="padding: 10px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${provider.salon_name}</h3>
            <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${provider.address}</p>
            <div style="display: flex; align-items: center; gap: 8px; margin: 8px 0;">
              <span style="color: #f59e0b;">★</span>
              <span style="font-weight: 500;">${provider.rating.toFixed(1)}</span>
              <span style="color: #666; font-size: 14px;">(${provider.review_count} recenzii)</span>
            </div>
            ${provider.verified ? '<span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">✓ Verificat</span>' : ''}
            ${provider.distance ? `<div style="margin-top: 8px; color: #666; font-size: 14px;">📍 ${formatDistance(provider.distance)}</div>` : ''}
          </div>
        `;
        
        infoWindow.setContent(content);
        infoWindow.open(mapInstanceRef.current, marker);
        onProviderSelect(provider);
      });

      markersRef.current.push(marker);

      // Highlight selected provider
      if (selectedProvider && selectedProvider.id === provider.id) {
        marker.setAnimation(window.google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 3000);
      }
    });

    // Fit bounds to show all markers
    if (markersRef.current.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      markersRef.current.forEach(marker => bounds.extend(marker.getPosition()));
      if (userLocation) {
        bounds.extend(new window.google.maps.LatLng(userLocation.lat, userLocation.lng));
      }
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [providers, selectedProvider, isMapLoaded]);

  const toggleMapType = () => {
    if (!mapInstanceRef.current) return;
    const newType = mapType === 'roadmap' ? 'satellite' : 'roadmap';
    setMapType(newType);
    mapInstanceRef.current.setMapTypeId(newType);
  };

  const centerOnUser = () => {
    if (!mapInstanceRef.current || !userLocation) return;
    mapInstanceRef.current.setCenter(userLocation);
    mapInstanceRef.current.setZoom(15);
  };

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={toggleMapType}
          className="bg-white shadow-md"
        >
          <Layers size={16} className="mr-1" />
          {mapType === 'roadmap' ? 'Satelit' : 'Hartă'}
        </Button>
        
        {userLocation && (
          <Button
            variant="secondary"
            size="sm"
            onClick={centerOnUser}
            className="bg-white shadow-md"
          >
            <Navigation size={16} className="mr-1" />
            Locația mea
          </Button>
        )}
      </div>

      {/* Selected Provider Actions */}
      {selectedProvider && selectedProvider.coordinates && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
          <h3 className="font-bold text-slate-800 mb-2">{selectedProvider.salon_name}</h3>
          <p className="text-sm text-slate-600 mb-3">{selectedProvider.address}</p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowDirections(true)}
              className="flex-1"
            >
              <Navigation size={16} className="mr-2" />
              Direcții
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (mapInstanceRef.current && selectedProvider.coordinates) {
                  const streetView = mapInstanceRef.current.getStreetView();
                  streetView.setPosition({
                    lat: selectedProvider.coordinates.lat,
                    lng: selectedProvider.coordinates.lng,
                  });
                  streetView.setVisible(true);
                }
              }}
            >
              Street View
            </Button>
          </div>
        </div>
      )}

      {/* Directions Modal */}
      {selectedProvider && userLocation && (
        <DirectionsModal
          isOpen={showDirections}
          onClose={() => setShowDirections(false)}
          origin={userLocation}
          destination={selectedProvider.coordinates!}
          providerName={selectedProvider.salon_name}
          providerAddress={selectedProvider.address}
        />
      )}
    </div>
  );
};