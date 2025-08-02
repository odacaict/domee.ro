import { supabase } from '../lib/supabase';
import { Provider, Service } from '../types';
import { apiClient, handleApiError } from './api';

// Funcții de validare - fără validare pentru cod fiscal și denumire firma
const validateProviderData = (data: Partial<Provider>) => {
  const errors: string[] = [];
  
  // Doar câmpurile esențiale sunt obligatorii
  if (!data.salon_name?.trim()) {
    errors.push("Numele salonului este obligatoriu");
  }
  
  if (!data.address?.trim() || !data.city?.trim()) {
    errors.push("Adresa și orașul sunt obligatorii");
  }
  
  // Validare IBAN - opțională (doar dacă este completat)
  if (data.payment_methods?.bank_accounts) {
    for (const account of data.payment_methods.bank_accounts) {
      if (account.iban && !/^RO\d{2}[A-Z]{4}[A-Z0-9]{16}$/.test(account.iban)) {
        errors.push("Format IBAN invalid");
        break;
      }
    }
  }
  
  return errors;
};

export const providerService = {
  // Helper function to convert hex to float (simplified)
  hexToFloat(hex: string): number {
    try {
      // Convert hex to binary, then to float
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      const bytes = hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [];
      
      for (let i = 0; i < Math.min(8, bytes.length); i++) {
        view.setUint8(i, bytes[i]);
      }
      
      return view.getFloat64(0, true); // little-endian
    } catch (error) {
      return 0;
    }
  },

  // Helper function to transform coordinates to app format
  transformCoordinates(data: any): any {
    if (data && Array.isArray(data)) {
      return data.map(item => this.transformCoordinates(item));
    }
    if (data && typeof data === 'object') {
      const transformed = { ...data };
      
      // Format 1: Coordonate din funcțiile RPC (JSON format)
      if (data.coordinates && typeof data.coordinates === 'object') {
        try {
          const { lat, lng } = data.coordinates;
          if (typeof lat === 'number' && typeof lng === 'number') {
            transformed.coordinates = { lat, lng };
          }
        } catch (error) {
          // Eroare la procesarea coordonatelor JSON
        }
      }
      // Format 2: Coordonate din PostGIS "POINT(lng lat)" 
      else if (data.location && typeof data.location === 'string' && data.location.startsWith('POINT(')) {
        try {
          const match = data.location.match(/POINT\(([^)]+)\)/);
          if (match) {
            const [lng, lat] = match[1].split(' ').map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
              transformed.coordinates = { lat, lng };
            }
          }
        } catch (error) {
          // Eroare la procesarea coordonatelor PostGIS
        }
      }
      
      return transformed;
    }
    return data;
  },

  async getProviders(filters?: any): Promise<Provider[]> {
    // Query simplu pentru toți providerii
    let query = supabase.from('providers').select('*');
    
    // Aplicăm filtrele
    if (filters?.city) {
      query = query.eq('city', filters.city);
    }
    
    if (filters?.rating) {
      query = query.gte('rating', filters.rating);
    }
    
    if (filters?.verified !== undefined) {
      query = query.eq('verified', filters.verified);
    }
    
    if (filters?.payment_methods) {
      if (filters.payment_methods.fiat) {
        query = query.eq('payment_methods->fiat', true);
      }
      if (filters.payment_methods.crypto) {
        query = query.eq('payment_methods->crypto', true);
      }
    }
    
    if (filters?.maxDistance && filters?.userLocation) {
      // Pentru căutarea după distanță, folosim funcția RPC
      const { data, error } = await supabase.rpc('get_nearby_providers', {
        user_lat: filters.userLocation.lat,
        user_lng: filters.userLocation.lng,
        radius_km: filters.maxDistance
      });
      
      if (error) {
        throw new Error(`Eroare la căutarea după distanță: ${error.message}`);
      }
      
      return data.map((item: any) => this.transformCoordinates(item)) as Provider[];
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Nu am putut încărca providerii: ${error.message}`);
    }
    
    // Transformăm coordonatele pentru fiecare provider
    const transformedData = data.map((item: any) => this.transformCoordinates(item));
    
    return transformedData as Provider[];
  },

  async getProviderById(id: string): Promise<Provider | null> {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      return null;
    }
    
    return this.transformCoordinates(data) as Provider;
  },

  async getProviderByUserId(userId: string): Promise<Provider | null> {
    const retryCount = 3;
    for (let i = 0; i < retryCount; i++) {
      try {
        const { data, error } = await supabase
          .from('providers')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (error) {
          if (i === retryCount - 1) {
            return null;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        return this.transformCoordinates(data) as Provider;
      } catch (error) {
        if (i === retryCount - 1) return null;
      }
    }
    
    return null;
  },

  async createProvider(data: Partial<Provider>): Promise<Provider> {
    const validationErrors = validateProviderData(data);
    if (validationErrors.length > 0) {
      throw new Error(`Validare eșuată: ${validationErrors.join(", ")}`);
    }

    // Verificăm dacă există deja un provider cu acest user_id
    const { data: existing, error: checkError } = await supabase
      .from('providers')
      .select('id')
      .eq('user_id', data.user_id)
      .single();

    if (existing) {
      return this.updateProvider(existing.id, data);
    }

    // Pregătim datele pentru inserare
    const insertData: any = {
      user_id: data.user_id,
      salon_name: data.salon_name,
      description: data.description || '',
      address: data.address,
      city: data.city,
      phone: data.phone,
      email: data.email,
      website: data.website || null,
      rating: 0,
      review_count: 0,
      verified: false,
      featured_image: data.featured_image || null,
      images: data.images || [],
      logo_url: data.logo_url || null,
      working_hours: data.working_hours || {},
      facilities: data.facilities || [],
      location_plus_code: data.location_plus_code || null,
      payment_methods: {
        fiat: data.payment_methods?.fiat || false,
        crypto: data.payment_methods?.crypto || false,
        bank_accounts: data.payment_methods?.bank_accounts || [],
        crypto_wallets: data.payment_methods?.crypto_wallets || [],
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Procesăm coordonatele dacă există
    if (data.coordinates && typeof data.coordinates === 'string') {
      try {
        const coords = data.coordinates.split(',').map(coord => coord.trim());
        if (coords.length === 2) {
          const lat = parseFloat(coords[0]);
          const lng = parseFloat(coords[1]);
          
          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            // Format PostGIS: POINT(lng lat)
            insertData.location = `POINT(${lng} ${lat})`;
          }
        }
      } catch (error) {
        // Eroare la procesarea coordonatelor
      }
    } else if (data.coordinates && typeof data.coordinates === 'object') {
      try {
        const { lat, lng } = data.coordinates;
        if (typeof lat === 'number' && typeof lng === 'number') {
          insertData.location = `POINT(${lng} ${lat})`;
        }
      } catch (error) {
        // Eroare la procesarea coordonatelor
      }
    }

    const { data: provider, error } = await supabase
      .from('providers')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      throw new Error(`Nu am putut crea profilul de provider: ${error.message}`);
    }

    return this.transformCoordinates(provider) as Provider;
  },

  async updateProvider(id: string, updates: Partial<Provider>): Promise<Provider> {
    // Procesăm coordonatele dacă există
    let processedUpdates = { ...updates };
    
    if (updates.coordinates && typeof updates.coordinates === 'string') {
      try {
        const coords = updates.coordinates.split(',').map(coord => coord.trim());
        if (coords.length === 2) {
          const lat = parseFloat(coords[0]);
          const lng = parseFloat(coords[1]);
          
          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            processedUpdates.location = `POINT(${lng} ${lat})`;
            delete processedUpdates.coordinates; // Eliminăm câmpul original
          }
        }
      } catch (error) {
        // Eroare la procesarea coordonatelor în update
      }
    }
    
    const { data: result, error } = await supabase
      .from('providers')
      .update(processedUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      handleApiError(error);
    }
    
    // Transformăm coordonatele la returnare
    return this.transformCoordinates(result) as Provider;
  },

  async searchProviders(query: string, userLocation?: { lat: number; lng: number }): Promise<Provider[]> {
    const { data, error } = await supabase
      .rpc('search_providers', {
        search_query: query,
        user_lat: userLocation?.lat,
        user_lng: userLocation?.lng,
      });

    if (error) {
      handleApiError(error);
    }
    
    // Transformăm coordonatele pentru fiecare provider
    const transformedData = data ? data.map((item: any) => this.transformCoordinates(item)) : [];
    
    return transformedData as Provider[];
  },

  async getNearbyProviders(lat: number, lng: number, radiusKm: number = 10): Promise<Provider[]> {
    const { data, error } = await supabase
      .rpc('get_nearby_providers', {
        user_lat: lat,
        user_lng: lng,
        radius_km: radiusKm,
      });

    if (error) handleApiError(error);
    return data as Provider[];
  },
};

// Create RPC functions in database
const searchProvidersFunction = `
CREATE OR REPLACE FUNCTION search_providers(
  search_query TEXT,
  user_lat FLOAT DEFAULT NULL,
  user_lng FLOAT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  salon_name TEXT,
  description TEXT,
  address TEXT,
  city TEXT,
  rating DECIMAL,
  review_count INTEGER,
  distance FLOAT,
  coordinates JSONB,
  location_text TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.salon_name,
    p.description,
    p.address,
    p.city,
    p.rating,
    p.review_count,
    CASE 
      WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL AND p.location IS NOT NULL THEN
        ST_Distance(p.location, ST_MakePoint(user_lng, user_lat)::geography) / 1000
      ELSE NULL
    END as distance,
    CASE 
      WHEN p.location IS NOT NULL THEN
        json_build_object('lat', ST_Y(p.location), 'lng', ST_X(p.location))
      ELSE NULL
    END as coordinates,
    ST_AsText(p.location) as location_text
  FROM providers p
  LEFT JOIN services s ON s.provider_id = p.id
  WHERE 
    p.salon_name ILIKE '%' || search_query || '%' OR
    p.description ILIKE '%' || search_query || '%' OR
    s.name ILIKE '%' || search_query || '%' OR
    p.city ILIKE '%' || search_query || '%'
  GROUP BY p.id
  ORDER BY 
    CASE WHEN p.salon_name ILIKE search_query || '%' THEN 0 ELSE 1 END,
    distance NULLS LAST,
    p.rating DESC;
END;
$$ LANGUAGE plpgsql;
`;

const getNearbyProvidersFunction = `
CREATE OR REPLACE FUNCTION get_nearby_providers(
  user_lat FLOAT,
  user_lng FLOAT,
  radius_km FLOAT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  salon_name TEXT,
  address TEXT,
  city TEXT,
  rating DECIMAL,
  distance FLOAT,
  coordinates JSONB,
  location_text TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.salon_name,
    p.address,
    p.city,
    p.rating,
    ST_Distance(p.location, ST_MakePoint(user_lng, user_lat)::geography) / 1000 as distance,
    CASE 
      WHEN p.location IS NOT NULL THEN
        json_build_object('lat', ST_Y(p.location), 'lng', ST_X(p.location))
      ELSE NULL
    END as coordinates,
    ST_AsText(p.location) as location_text
  FROM providers p
  WHERE 
    p.location IS NOT NULL AND
    ST_DWithin(p.location, ST_MakePoint(user_lng, user_lat)::geography, radius_km * 1000)
  ORDER BY distance;
END;
$$ LANGUAGE plpgsql;
`;