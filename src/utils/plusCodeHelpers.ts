export const plusCodeHelpers = {
  // Validarea Plus Code
  isValidPlusCode(code: string): boolean {
    if (!code) return false;
    
    // Plus Code format: 8 characters + "+" + 2-3 characters + " " + city name
    const plusCodeRegex = /^[23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{2,3}\s+[A-Za-z\s]+$/;
    return plusCodeRegex.test(code);
  },

  // Extragerea orașului din Plus Code
  extractCityFromPlusCode(plusCode: string): string | null {
    if (!this.isValidPlusCode(plusCode)) return null;
    
    const parts = plusCode.split(' ');
    if (parts.length >= 2) {
      return parts.slice(1).join(' '); // Tot ce urmează după primul spațiu
    }
    return null;
  },

  // Conversia Plus Code în coordonate folosind Google Geocoding API
  async plusCodeToCoordinates(plusCode: string): Promise<{ lat: number; lng: number } | null> {
    if (!this.isValidPlusCode(plusCode)) {
      console.warn('Plus Code invalid:', plusCode);
      return null;
    }

    if (!window.google || !window.google.maps) {
      console.error('Google Maps nu este încărcat');
      return null;
    }

    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve) => {
      geocoder.geocode({ address: plusCode }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          console.log('Plus Code convertit în coordonate:', plusCode, '→', {
            lat: location.lat(),
            lng: location.lng()
          });
          resolve({
            lat: location.lat(),
            lng: location.lng(),
          });
        } else {
          console.warn('Nu s-a putut converti Plus Code în coordonate:', plusCode, status);
          resolve(null);
        }
      });
    });
  },

  // Conversia coordonatelor în Plus Code folosind Google Geocoding API
  async coordinatesToPlusCode(lat: number, lng: number): Promise<string | null> {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps nu este încărcat');
      return null;
    }

    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve) => {
      geocoder.geocode({ 
        location: new window.google.maps.LatLng(lat, lng) 
      }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          // Căutăm Plus Code în rezultate
          const plusCode = this.findPlusCodeInResults(results[0]);
          if (plusCode) {
            console.log('Coordonate convertite în Plus Code:', { lat, lng }, '→', plusCode);
            resolve(plusCode);
          } else {
            console.warn('Nu s-a găsit Plus Code pentru coordonatele:', { lat, lng });
            resolve(null);
          }
        } else {
          console.warn('Nu s-a putut converti coordonatele în Plus Code:', { lat, lng }, status);
          resolve(null);
        }
      });
    });
  },

  // Căutarea Plus Code în rezultatele geocoding
  findPlusCodeInResults(result: any): string | null {
    // Căutăm în address_components
    for (const component of result.address_components) {
      if (component.types.includes('plus_code')) {
        return component.long_name;
      }
    }
    
    // Căutăm în formatted_address
    const plusCodeMatch = result.formatted_address.match(/[23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{2,3}/);
    if (plusCodeMatch) {
      return plusCodeMatch[0];
    }
    
    return null;
  },

  // Generarea Plus Code din adresă
  async generatePlusCodeFromAddress(address: string): Promise<string | null> {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps nu este încărcat');
      return null;
    }

    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve) => {
      geocoder.geocode({ address }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const plusCode = this.findPlusCodeInResults(results[0]);
          if (plusCode) {
            console.log('Plus Code generat din adresă:', address, '→', plusCode);
            resolve(plusCode);
          } else {
            console.warn('Nu s-a găsit Plus Code pentru adresa:', address);
            resolve(null);
          }
        } else {
          console.warn('Nu s-a putut genera Plus Code pentru adresa:', address, status);
          resolve(null);
        }
      });
    });
  },

  // Calcularea distanței între Plus Codes
  async calculateDistanceBetweenPlusCodes(plusCode1: string, plusCode2: string): Promise<number | null> {
    const coords1 = await this.plusCodeToCoordinates(plusCode1);
    const coords2 = await this.plusCodeToCoordinates(plusCode2);
    
    if (!coords1 || !coords2) {
      return null;
    }

    // Folosim formula Haversine pentru calculul distanței
    const R = 6371; // Raza Pământului în km
    const dLat = this.toRad(coords2.lat - coords1.lat);
    const dLng = this.toRad(coords2.lng - coords1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coords1.lat)) *
        Math.cos(this.toRad(coords2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  },

  // Helper pentru conversia grade în radiani
  toRad(value: number): number {
    return (value * Math.PI) / 180;
  },

  // Testarea funcționalităților Plus Code
  async testPlusCodeFunctionality(): Promise<void> {
    console.log('=== Test Plus Code Functionality ===');
    
    // Test 1: Validarea Plus Code
    const testPlusCode = 'M723+WM8 Milcovul';
    console.log('Plus Code valid:', this.isValidPlusCode(testPlusCode));
    
    // Test 2: Extragerea orașului
    const city = this.extractCityFromPlusCode(testPlusCode);
    console.log('Oraș extras:', city);
    
    // Test 3: Conversia Plus Code în coordonate (doar dacă Google Maps este încărcat)
    if (window.google && window.google.maps) {
      const coords = await this.plusCodeToCoordinates(testPlusCode);
      console.log('Coordonate convertite:', coords);
    } else {
      console.log('Google Maps nu este încărcat pentru test');
    }
    
    console.log('=== Test complet ===');
  }
}; 