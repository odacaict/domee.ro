import React, { useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { Welcome } from './components/onboarding/Welcome';
import { MainView } from './components/main/MainView';
import { ProviderProfile } from './components/booking/ProviderProfile';
import { BookingHistory } from './components/booking/BookingHistory';
import { ProviderSignup } from './components/auth/ProviderSignup';
import { ProviderDashboard } from './components/provider/ProviderDashboard';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import { Provider, Service } from './types';

const AppContent: React.FC = () => {
  const { isAuthenticated, userType, providerProfile, checkingProfile, refreshProviderProfile } = useApp();
  const [currentView, setCurrentView] = useState<'welcome' | 'main' | 'provider_profile' | 'bookings' | 'provider_signup'>('welcome');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const handleWelcomeAccept = () => setCurrentView('main');

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setCurrentView('provider_profile');
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setSelectedProvider(null);
  };

  const handleBookService = (service: Service) => {
    alert(`Booking ${service.name} at ${selectedProvider?.salon_name} - Calendar integration coming soon!`);
  };

  const handleNavigate = (view: string) => {
    if (view === 'provider_signup') {
      setCurrentView('provider_signup');
    } else if (view === 'bookings') {
      setCurrentView('bookings');
    } else {
      setCurrentView('main');
    }
  };

  const handleProviderSignupSuccess = async () => {
    await refreshProviderProfile();
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Se încarcă..." />
      </div>
    );
  }

  if (isAuthenticated && userType === 'provider') {
    if (providerProfile) {
      return <ProviderDashboard provider={providerProfile} onBackToMain={handleBackToMain} />;
    } else if (currentView === 'provider_signup') {
      return <ProviderSignup onBack={handleBackToMain} onSuccess={handleProviderSignupSuccess} />;
    } else {
      const lastError = window.localStorage.getItem('providerProfileError');
      window.localStorage.removeItem('providerProfileError');

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-slide-up">
            <h2 className="text-2xl font-bold text-red-700 mb-2">Finalizează sau Creează Profilul</h2>
            <p className="text-slate-600 mb-6">
              {lastError || 'Contul tău de furnizor este activ, dar profilul nu este complet. Te rugăm să completezi detaliile afacerii tale.'}
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => setCurrentView('provider_signup')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-lg transition-colors">Completează profilul</button>
              <button onClick={() => setCurrentView('main')} className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-3 rounded-lg transition-colors">Înapoi la pagina principală</button>
            </div>
          </div>
        </div>
      );
    }
  }

  switch (currentView) {
    case 'main':
      return <MainView onProviderSelect={handleProviderSelect} onNavigate={handleNavigate} />;

    case 'provider_profile':
      if (selectedProvider) {
        return <ProviderProfile provider={selectedProvider} onBack={handleBackToMain} onBookService={handleBookService} />;
      }
      setCurrentView('main');
      return null;

    case 'bookings':
      return <BookingHistory onBack={handleBackToMain} />;

    case 'provider_signup':
      if (!isAuthenticated) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-slide-up">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Trebuie să fii autentificat</h2>
              <p className="text-slate-600 mb-6">
                Pentru a completa profilul de furnizor, te rugăm să te autentifici în contul tău.
              </p>
              <button onClick={() => setCurrentView('main')} className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-3 rounded-lg transition-colors">Înapoi la pagina principală</button>
            </div>
          </div>
        );
      }
      return <ProviderSignup onBack={handleBackToMain} onSuccess={handleProviderSignupSuccess} />;

    case 'welcome':
    default:
      return <Welcome onAccept={handleWelcomeAccept} />;
  }
};

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;