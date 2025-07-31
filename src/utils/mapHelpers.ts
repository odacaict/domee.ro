export const mapHelpers = {
  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLng = this.toRad(coord2.lng - coord1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coord1.lat)) *
        Math.cos(this.toRad(coord2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  toRad(value: number): number {
    return (value * Math.PI) / 180;
  },

  // Get user's current location
  async getUserLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocalizarea nu este suportată de acest browser');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Locație obținută cu succes:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Eroare la geolocalizare:', {
            code: error.code,
            message: error.message
          });
          
          let errorMessage = 'Nu s-a putut obține locația';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Accesul la locație a fost refuzat';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Informațiile despre locație nu sunt disponibile';
              break;
            case error.TIMEOUT:
              errorMessage = 'Cererea de locație a expirat';
              break;
          }
          console.warn(errorMessage);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Mărit de la 5000 la 15000ms
          maximumAge: 300000, // Cache pentru 5 minute
        }
      );
    });
  },

  // Convert address to coordinates using Google Geocoding
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps not loaded');
      return null;
    }

    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve) => {
      geocoder.geocode({ address }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
          });
        } else {
          resolve(null);
        }
      });
    });
  },

  // Format coordinates for display
  formatCoordinates(lat: number, lng: number): string {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  },

  // Check if Google Maps is loaded
  isGoogleMapsLoaded(): boolean {
    const isLoaded = !!(window.google && window.google.maps);
    console.log('Google Maps loaded status:', isLoaded);
    return isLoaded;
  },

  // Load Google Maps script dynamically
  loadGoogleMaps(apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isGoogleMapsLoaded()) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps'));
      
      document.head.appendChild(script);
    });
  },

  // Get bounds for multiple coordinates
  getBounds(coordinates: Array<{ lat: number; lng: number }>): any {
    if (!window.google || !window.google.maps || coordinates.length === 0) {
      return null;
    }

    const bounds = new window.google.maps.LatLngBounds();
    coordinates.forEach(coord => {
      bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
    });
    
    return bounds;
  },

  // Create custom map marker
  createCustomMarker(options: {
    position: { lat: number; lng: number };
    map: any;
    title: string;
    color?: string;
    label?: string;
    onClick?: () => void;
  }): any {
    if (!window.google || !window.google.maps) {
      return null;
    }

    const marker = new window.google.maps.Marker({
      position: options.position,
      map: options.map,
      title: options.title,
      icon: {
        path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: options.color || '#f59e0b',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      label: options.label ? {
        text: options.label,
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold',
      } : undefined,
    });

    if (options.onClick) {
      marker.addListener('click', options.onClick);
    }

    return marker;
  },

 // Romanian cities coordinates
romanianCities: {
  'Alba Iulia': { lat: 46.0731, lng: 23.5802 },
  'Arad': { lat: 46.1866, lng: 21.3123 },
  'Alexandria': { lat: 43.9747, lng: 25.3310 },
  'Bacău': { lat: 46.5670, lng: 26.9146 },
  'Baia Mare': { lat: 47.6567, lng: 23.5850 },
  'Bistrița': { lat: 47.1357, lng: 24.5000 },
  'Botoșani': { lat: 47.7488, lng: 26.6669 },
  'Brăila': { lat: 45.2692, lng: 27.9575 },
  'Brașov': { lat: 45.6579, lng: 25.6012 },
  'București': { lat: 44.4268, lng: 26.1025 },
  'Buzău': { lat: 45.1500, lng: 26.8333 },
  'Călărași': { lat: 44.2068, lng: 27.3259 },
  'Cluj-Napoca': { lat: 46.7712, lng: 23.6236 },
  'Constanța': { lat: 44.1598, lng: 28.6348 },
  'Craiova': { lat: 44.3302, lng: 23.7949 },
  'Deva': { lat: 45.8784, lng: 22.9126 },
  'Drobeta-Turnu Severin': { lat: 44.6369, lng: 22.6597 },
  'Focșani': { lat: 45.6964, lng: 27.1867 },
  'Giurgiu': { lat: 43.9037, lng: 25.9699 },
  'Iași': { lat: 47.1585, lng: 27.6014 },
  'Miercurea Ciuc': { lat: 46.3616, lng: 25.8019 },
  'Oradea': { lat: 47.0722, lng: 21.9212 },
  'Piatra Neamț': { lat: 46.9304, lng: 26.3700 },
  'Pitești': { lat: 44.8565, lng: 24.8692 },
  'Ploiești': { lat: 44.9360, lng: 26.0225 },
  'Râmnicu Vâlcea': { lat: 45.1048, lng: 24.3754 },
  'Reșița': { lat: 45.3008, lng: 21.8895 },
  'Satu Mare': { lat: 47.7925, lng: 22.8853 },
  'Sfântu Gheorghe': { lat: 45.8609, lng: 25.7886 },
  'Sibiu': { lat: 45.7983, lng: 24.1256 },
  'Slatina': { lat: 44.4307, lng: 24.3714 },
  'Slobozia': { lat: 44.5702, lng: 27.3784 },
  'Suceava': { lat: 47.6514, lng: 26.2556 },
  'Târgoviște': { lat: 44.9256, lng: 25.4564 },
  'Târgu Jiu': { lat: 45.0310, lng: 23.2748 },
  'Târgu Mureș': { lat: 46.5386, lng: 24.5514 },
  'Timișoara': { lat: 45.7489, lng: 21.2087 },
  'Tulcea': { lat: 45.1715, lng: 28.7914 },
  'Vaslui': { lat: 46.6407, lng: 27.7276 },
  'Zalău': { lat: 47.1833, lng: 23.0500 }
},

  // Get coordinates for Romanian city
  getRomanianCityCoords(city: string): { lat: number; lng: number } | null {
    return this.romanianCities[city] || null;
  },

  // Test function for distance calculation with known coordinates
  testDistanceCalculation(): void {
    const bucuresti = { lat: 44.4268, lng: 26.1025 };
    const cluj = { lat: 46.7712, lng: 23.6236 };
    const timisoara = { lat: 45.7489, lng: 21.2087 };
    
    const bucurestiCluj = this.calculateDistance(bucuresti, cluj);
    const bucurestiTimisoara = this.calculateDistance(bucuresti, timisoara);
    const clujTimisoara = this.calculateDistance(cluj, timisoara);
    
    console.log('Test calcul distanțe:');
    console.log('București - Cluj:', bucurestiCluj.toFixed(2), 'km');
    console.log('București - Timișoara:', bucurestiTimisoara.toFixed(2), 'km');
    console.log('Cluj - Timișoara:', clujTimisoara.toFixed(2), 'km');
    
    // Verificăm că distanțele sunt rezonabile (între 200-500km pentru aceste orașe)
    const isValid = bucurestiCluj > 200 && bucurestiCluj < 500 &&
                   bucurestiTimisoara > 200 && bucurestiTimisoara < 500 &&
                   clujTimisoara > 200 && clujTimisoara < 500;
    
    console.log('Calculul distanțelor este valid:', isValid);
  },

  // Initialize and test all location functionality
  async initializeLocationServices(): Promise<void> {
    console.log('=== Inițializare servicii locație ===');
    
    // Test 1: Calculul distanțelor
    this.testDistanceCalculation();
    
    // Test 2: Verificarea Google Maps
    const mapsLoaded = this.isGoogleMapsLoaded();
    console.log('Google Maps status:', mapsLoaded ? 'ÎNCĂRCAT' : 'NU ESTE ÎNCĂRCAT');
    
    // Test 3: Încercarea de obținere a locației (doar dacă utilizatorul permite)
    try {
      const userLocation = await this.getUserLocation();
      if (userLocation) {
        console.log('Locația utilizatorului obținută:', userLocation);
      } else {
        console.log('Locația utilizatorului nu a putut fi obținută');
      }
    } catch (error) {
      console.error('Eroare la testarea locației:', error);
    }
    
    console.log('=== Inițializare completă ===');
  },
};