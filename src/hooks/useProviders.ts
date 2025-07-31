import { useState, useEffect } from 'react';
import { Provider } from '../types';
import { providerService } from '../services/providerService';

export function useProviders(filters?: any) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        const data = await providerService.getProviders(filters);
        setProviders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch providers');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [JSON.stringify(filters)]);

  return { providers, loading, error };
}

export function useProvider(id: string) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProvider = async () => {
      try {
        setLoading(true);
        const data = await providerService.getProviderById(id);
        setProvider(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch provider');
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [id]);

  return { provider, loading, error };
}