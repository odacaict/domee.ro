import { useState, useEffect } from 'react';
import { Service } from '../types';
import { supabase } from '../lib/supabase';

export function useServices(providerId?: string) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!providerId) {
      setLoading(false);
      return;
    }

    fetchServices();
  }, [providerId]);

  const fetchServices = async () => {
    if (!providerId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', providerId)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const createService = async (serviceData: Partial<Service>) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert({
          ...serviceData,
          provider_id: providerId,
        })
        .select()
        .single();

      if (error) throw error;
      setServices([...services, data]);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const updateService = async (serviceId: string, updates: Partial<Service>) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;
      setServices(services.map(s => s.id === serviceId ? data : s));
      return data;
    } catch (err) {
      throw err;
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      setServices(services.filter(s => s.id !== serviceId));
    } catch (err) {
      throw err;
    }
  };

  const toggleServiceStatus = async (serviceId: string, active: boolean) => {
    return updateService(serviceId, { active });
  };

  return {
    services,
    loading,
    error,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
    refresh: fetchServices,
  };
}