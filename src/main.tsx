import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Check for required environment variables
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

requiredEnvVars.forEach(varName => {
  if (!import.meta.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
  }
});

// Optional: Log environment
if (import.meta.env.DEV) {
  console.log('Running in development mode');
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('Google Maps available:', !!import.meta.env.VITE_GOOGLE_MAPS_KEY);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);