import { supabase } from '../lib/supabase';

export class ApiError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: any): never => {
  console.error('API Error:', error);
  
  if (error.message) {
    throw new ApiError(error.message, error.code);
  }
  
  throw new ApiError('An unexpected error occurred');
};

export const apiClient = {
  async get<T>(table: string, query?: any): Promise<T[]> {
    const { data, error } = await supabase
      .from(table)
      .select(query?.select || '*');
    
    if (error) handleApiError(error);
    return data as T[];
  },

  async getById<T>(table: string, id: string, query?: any): Promise<T> {
    const { data, error } = await supabase
      .from(table)
      .select(query?.select || '*')
      .eq('id', id)
      .single();
    
    if (error) handleApiError(error);
    return data as T;
  },

  async create<T>(table: string, data: any): Promise<T> {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    
    if (error) handleApiError(error);
    return result as T;
  },

  async update<T>(table: string, id: string, data: any): Promise<T> {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) handleApiError(error);
    return result as T;
  },

  async delete(table: string, id: string): Promise<void> {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) handleApiError(error);
  },
};