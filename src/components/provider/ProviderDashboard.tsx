import React, { useState } from 'react';
import { LayoutDashboard, Calendar, Users, Star as StarIcon, Image, Settings, LogOut, ArrowLeft } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Provider } from '../../types';
import { RevenueStats } from './RevenueStats';
import { ServiceManagement } from './ServiceManagement';
import { CalendarView } from './CalendarView';
import { ProfileEditor } from './ProfileEditor';
import { GalleryManager } from './GalleryManager';
import { ReviewDashboard } from './ReviewDashboard';
import { Button } from '../ui/Button';

// MODIFICARE CHEIE: Componenta primește acum 'provider' ca prop
interface ProviderDashboardProps {
  provider: Provider;
  onBackToMain?: () => void;
}

type TabType = 'overview' | 'calendar' | 'services' | 'reviews' | 'gallery' | 'profile';

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ provider, onBackToMain }) => {
  const { logout, refreshProviderProfile } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProviderProfile();
    } catch (error) {
      console.error("Eroare la reîmprospătarea datelor:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Validare date esențiale
  if (!provider || !provider.salon_name || !provider.id) {
    const error = window.localStorage.getItem('providerProfileError');
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-slide-up">
          <h2 className="text-2xl font-bold text-red-700 mb-2">
            Datele profilului nu sunt complete
          </h2>
          <p className="text-slate-600 mb-6">
            {error || "Te rugăm să completezi toate informațiile necesare pentru activarea contului."}
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {isRefreshing ? "Se reîncarcă..." : "Reîncarcă datele"}
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
            >
              Reîncarcă pagina
            </button>
          </div>
        </div>
      </div>
    );
  }

  const safeRating = typeof provider.rating === 'number' ? provider.rating : 0;
  const safeReviewCount = typeof provider.review_count === 'number' ? provider.review_count : 0;
  const safeSalonType = provider.salon_type || '-';
  const safeSalonName = provider.salon_name || 'Salon';

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const menuItems = [
    { id: 'overview' as const, label: 'Prezentare Generală', icon: LayoutDashboard },
    { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
    { id: 'services' as const, label: 'Servicii', icon: Users },
    { id: 'reviews' as const, label: 'Recenzii', icon: StarIcon },
    { id: 'gallery' as const, label: 'Galerie', icon: Image },
    { id: 'profile' as const, label: 'Profil', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBackToMain || (() => window.history.back())}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors md:hidden"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-800">{safeSalonName}</h1>
                <p className="text-sm text-slate-600">Panou de Control</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {provider.verified && (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  ✓ Verificat
                </span>
              )}
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut size={18} className="mr-2" />
                <span className="hidden md:inline">Deconectare</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden md:block w-64 bg-white shadow-sm border-r border-slate-200 min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-amber-50 text-amber-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Rating</p>
                      <p className="text-2xl font-bold text-slate-800">{safeRating.toFixed(1)}</p>
                    </div>
                    <div className="p-3 bg-amber-100 rounded-lg">
                      <StarIcon className="text-amber-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Recenzii</p>
                      <p className="text-2xl font-bold text-slate-800">{safeReviewCount}</p>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-lg">
                      <Users className="text-emerald-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Tip Salon</p>
                      <p className="text-2xl font-bold text-slate-800">{safeSalonType}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Image className="text-blue-600" size={24} />
                    </div>
                  </div>
                </div>
              </div>

              <RevenueStats providerId={provider.id} />
            </div>
          )}

          {activeTab === 'calendar' && <CalendarView providerId={provider.id} />}
          {activeTab === 'services' && <ServiceManagement providerId={provider.id} />}
          {activeTab === 'reviews' && <ReviewDashboard providerId={provider.id} />}
          {activeTab === 'gallery' && <GalleryManager providerId={provider.id} />}
          {activeTab === 'profile' && <ProfileEditor providerId={provider.id} />}
        </main>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200">
        <div className="flex justify-around p-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'text-amber-600'
                  : 'text-slate-600'
              }`}
            >
              <item.icon size={20} />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
