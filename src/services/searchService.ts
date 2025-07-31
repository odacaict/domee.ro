import { supabase } from '../lib/supabase';
import { Provider, Service } from '../types';
import { handleApiError } from './api';
import { plusCodeHelpers } from '../utils/plusCodeHelpers';

export interface SearchResult {
  providers: Provider[];
  services: Service[];
  suggestions: string[];
}

export const searchService = {
  async search(query: string, filters?: any): Promise<SearchResult> {
    const [providers, services, suggestions] = await Promise.all([
      this.searchProviders(query, filters),
      this.searchServices(query, filters),
      this.getSearchSuggestions(query),
    ]);

    return { providers, services, suggestions };
  },

  async searchProviders(query: string, filters?: any): Promise<Provider[]> {
    // Verificăm dacă query-ul este un Plus Code
    const isPlusCode = plusCodeHelpers.isValidPlusCode(query);
    
    if (isPlusCode) {
      // Căutare după Plus Code
      return this.searchByPlusCode(query, filters);
    } else {
      // Căutare text normală
      return this.searchByText(query, filters);
    }
  },

  // Căutare după Plus Code
  async searchByPlusCode(plusCode: string, filters?: any): Promise<Provider[]> {
    console.log('Căutare după Plus Code:', plusCode);
    
    let queryBuilder = supabase
      .from('providers')
      .select('*')
      .ilike('location_plus_code', `%${plusCode}%`);

    // Aplicăm filtrele
    if (filters?.minReviews) {
      queryBuilder = queryBuilder.gte('review_count', filters.minReviews);
    }
    if (filters?.minRating) {
      queryBuilder = queryBuilder.gte('rating', filters.minRating);
    }
    if (filters?.salonType) {
      queryBuilder = queryBuilder.eq('salon_type', filters.salonType);
    }
    if (filters?.paymentMethods?.crypto) {
      queryBuilder = queryBuilder.eq('payment_methods->crypto', true);
    }
    if (filters?.paymentMethods?.fiat) {
      queryBuilder = queryBuilder.eq('payment_methods->fiat', true);
    }
    if (filters?.verified) {
      queryBuilder = queryBuilder.eq('verified', true);
    }
    if (filters?.facilities?.length) {
      queryBuilder = queryBuilder.contains('facilities', filters.facilities);
    }

    const { data, error } = await queryBuilder.limit(20);
    if (error) handleApiError(error);
    
    console.log('Rezultate căutare Plus Code:', data?.length || 0);
    return data as Provider[];
  },

  // Căutare text normală
  async searchByText(query: string, filters?: any): Promise<Provider[]> {
    let queryBuilder = supabase
      .from('providers')
      .select('*')
      .or(`salon_name.ilike.%${query}%,description.ilike.%${query}%,city.ilike.%${query}%`);

    // Aplicăm filtrele
    if (filters?.minReviews) {
      queryBuilder = queryBuilder.gte('review_count', filters.minReviews);
    }
    if (filters?.minRating) {
      queryBuilder = queryBuilder.gte('rating', filters.minRating);
    }
    if (filters?.salonType) {
      queryBuilder = queryBuilder.eq('salon_type', filters.salonType);
    }
    if (filters?.paymentMethods?.crypto) {
      queryBuilder = queryBuilder.eq('payment_methods->crypto', true);
    }
    if (filters?.paymentMethods?.fiat) {
      queryBuilder = queryBuilder.eq('payment_methods->fiat', true);
    }
    if (filters?.verified) {
      queryBuilder = queryBuilder.eq('verified', true);
    }
    if (filters?.facilities?.length) {
      queryBuilder = queryBuilder.contains('facilities', filters.facilities);
    }

    const { data, error } = await queryBuilder.limit(20);
    if (error) handleApiError(error);
    
    return data as Provider[];
  },

  async searchServices(query: string, filters?: any): Promise<Service[]> {
    let queryBuilder = supabase
      .from('services')
      .select(`
        *,
        provider:providers(*)
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('active', true);

    if (filters?.minPrice !== undefined) {
      queryBuilder = queryBuilder.gte('price', filters.minPrice);
    }
    if (filters?.maxPrice !== undefined) {
      queryBuilder = queryBuilder.lte('price', filters.maxPrice);
    }

    const { data, error } = await queryBuilder.limit(20);
    if (error) handleApiError(error);
    
    return data as Service[];
  },

  async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];

    // Get suggestions from providers and services
    const { data: providers } = await supabase
      .from('providers')
      .select('salon_name')
      .ilike('salon_name', `${query}%`)
      .limit(5);

    const { data: services } = await supabase
      .from('services')
      .select('name')
      .ilike('name', `${query}%`)
      .limit(5);

    const suggestions = new Set<string>();
    
    providers?.forEach(p => suggestions.add(p.salon_name));
    services?.forEach(s => suggestions.add(s.name));

    return Array.from(suggestions).slice(0, 8);
  },

  async saveSearchHistory(userId: string | null, query: string, filters: any, resultsCount: number) {
    if (!userId) return;

    await supabase
      .from('search_history')
      .insert({
        user_id: userId,
        query,
        filters,
        results_count: resultsCount,
      });
  },

  async getRecentSearches(userId: string): Promise<string[]> {
    const { data } = await supabase
      .from('search_history')
      .select('query')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    return data?.map(s => s.query) || [];
  },

  // Căutare furnizori în apropierea unui Plus Code
  async searchProvidersNearPlusCode(plusCode: string, radiusKm: number = 10): Promise<Provider[]> {
    console.log('Căutare furnizori în apropierea Plus Code:', plusCode, 'rază:', radiusKm, 'km');
    
    // Convertim Plus Code în coordonate
    const coordinates = await plusCodeHelpers.plusCodeToCoordinates(plusCode);
    if (!coordinates) {
      console.warn('Nu s-a putut converti Plus Code în coordonate:', plusCode);
      return [];
    }

    // Folosim funcția RPC pentru căutarea după distanță
    const { data, error } = await supabase.rpc('get_nearby_providers', {
      user_lat: coordinates.lat,
      user_lng: coordinates.lng,
      radius_km: radiusKm
    });

    if (error) {
      console.error('Eroare la căutarea după Plus Code:', error);
      handleApiError(error);
    }

    console.log('Rezultate căutare în apropierea Plus Code:', data?.length || 0);
    return data as Provider[];
  }
};