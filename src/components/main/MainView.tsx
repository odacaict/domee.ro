import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../layout/Header';
import { SearchBar } from '../search/SearchBar';
import { BarbershopCard } from '../barbershop/BarbershopCard';
import { SideMenu } from '../layout/SideMenu';
import { FilterModal } from '../search/FilterModal';
import { MapView } from '../map/MapView';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { Provider, FilterCriteria } from '../../types';
import { ChevronLeft, ChevronRight, MapPin, Sparkles, Clock, Shield, CreditCard, Grid3X3, Map, XCircle } from 'lucide-react';
import { useProviders } from '../../hooks/useProviders';
import { searchService } from '../../services/searchService';
import { providerService } from '../../services/providerService';
import { mapHelpers } from '../../utils/mapHelpers';
import { plusCodeHelpers } from '../../utils/plusCodeHelpers';
import { Button } from '../ui/Button';

// *** NOU: Componenta de Notificare ***
// O componentă simplă pentru a afișa mesaje de eroare în loc de alert().
const Notification = ({ message, onClose }: { message: string, onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000); // Se închide automat după 5 secunde
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-20 right-4 z-50 bg-red-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-4 animate-fade-in-down">
      <XCircle size={24} />
      <span>{message}</span>
      <button onClick={onClose} className="ml-4">&times;</button>
    </div>
  );
};


interface MainViewProps {
  onProviderSelect: (provider: Provider) => void;
  onNavigate: (view: string) => void;
}

export const MainView: React.FC<MainViewProps> = ({ onProviderSelect, onNavigate }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'carousel' | 'map'>('carousel');
  const [selectedMapProvider, setSelectedMapProvider] = useState<Provider | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // *** NOU: Stare pentru notificări ***
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch providers based on filters. Aceasta rămâne sursa principală de date la aplicarea filtrelor.
  const { providers: providersFromHook, loading } = useProviders(filters);
  
  // *** MODIFICAT: Stare separată pentru furnizorii afișați ***
  // Acest state ne permite să suprascriem lista cu rezultate din apropiere, fără a modifica filtrele active.
  const [displayedProviders, setDisplayedProviders] = useState<Provider[]>([]);

  // Sincronizăm lista afișată cu datele primite de la hook-ul de bază
  useEffect(() => {
    setDisplayedProviders(providersFromHook);
  }, [providersFromHook]);


  // Get user location on mount
  useEffect(() => {
    const initializeLocation = async () => {
      // Inițializăm și testăm serviciile de locație
      await mapHelpers.initializeLocationServices();
      
      // Testăm Plus Codes
      await plusCodeHelpers.testPlusCodeFunctionality();
      
      const location = await mapHelpers.getUserLocation();
      if (location) {
        setUserLocation(location);
        console.log('Locația utilizatorului setată în MainView:', location);
      }
    };
    initializeLocation();
  }, []);

  // Filter and enhance providers based on search query and location
  // *** MODIFICAT: Folosește `displayedProviders` ca sursă de date ***
  const enhancedProviders = React.useMemo(() => {
    let filtered = displayedProviders;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(provider =>
        provider.salon_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Calculate distances if user location is available
    if (userLocation) {
      console.log("User location available:", userLocation);
      filtered = filtered.map(provider => {
        console.log("Provider:", provider.salon_name, "Coordinates:", provider.coordinates);
        if (provider.coordinates) {
          const distance = mapHelpers.calculateDistance(userLocation, provider.coordinates);
          console.log("Calculated distance for", provider.salon_name, ":", distance, "km");
          return { ...provider, distance };
        }
        console.log("No coordinates for provider:", provider.salon_name);
        return provider;
      }).sort((a, b) => (a.distance || 999) - (b.distance || 999));
    } else {
      console.log("No user location available");
    }

    return filtered;
  }, [displayedProviders, searchQuery, userLocation]);

  const infiniteProviders = [...enhancedProviders, ...enhancedProviders, ...enhancedProviders];
  const centerOffset = enhancedProviders.length;

  useEffect(() => {
    setActiveIndex(centerOffset);
  }, [centerOffset]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      // Verificăm dacă este un Plus Code
      const isPlusCode = plusCodeHelpers.isValidPlusCode(query);
      
      if (isPlusCode) {
        console.log('Căutare Plus Code detectată:', query);
        // Pentru Plus Codes, căutăm furnizori în apropiere
        try {
          const nearbyProviders = await searchService.searchProvidersNearPlusCode(query, 10);
          setDisplayedProviders(nearbyProviders);
        } catch (error) {
          console.error('Eroare la căutarea după Plus Code:', error);
          setNotification('Nu s-au putut găsi furnizori în apropierea Plus Code-ului.');
        }
      } else {
        // Căutare text normală
        setDisplayedProviders(providersFromHook);
        const results = await searchService.search(query, filters);
        const totalResults = results.providers.length + results.services.length;
        if (userLocation) {
          await searchService.saveSearchHistory(null, query, filters, totalResults);
        }
      }
    }
  };

  const handleApplyFilters = (newFilters: FilterCriteria) => {
    setFilters(newFilters);
    // Când se aplică filtre, rezultatele de la hook se vor schimba,
    // iar useEffect-ul de mai sus va actualiza `displayedProviders`.
  };

  // *** MODIFICAT: Logica pentru click pe locație ***
  const handleLocationClick = async () => {
    const location = await mapHelpers.getUserLocation();
    if (location) {
      setUserLocation(location);
      
      try {
        // Fetch nearby providers
        const nearbyProviders = await providerService.getNearbyProviders(
          location.lat,
          location.lng,
          filters.maxDistance || 10 // Folosim distanța din filtre dacă există
        );

        // *** AICI ESTE REMEDIEREA CHEIE ***
        // Actualizăm direct lista afișată cu furnizorii din apropiere.
        setDisplayedProviders(nearbyProviders);
        
        // Resetăm căutarea text pentru a nu crea confuzie
        setSearchQuery('');

      } catch (error) {
        console.error('Failed to fetch nearby providers:', error);
        setNotification('Nu am putut prelua saloanele din apropiere. Încercați din nou.');
      }
    } else {
      // Feedback specific pentru erorile de locație
      setNotification('Nu s-a putut obține locația. Verifică setările browserului și încearcă din nou.');
    }
  };

  const handleBook = (provider: Provider) => onProviderSelect(provider);
  const handleViewMap = (provider: Provider) => {
    setSelectedMapProvider(provider);
    setViewMode('map');
  };
  
  // *** MODIFICAT: Logica de selectare a furnizorului pe hartă ***
  // Acum, la selectarea unui pin, doar setăm furnizorul activ pentru a afișa
  // detaliile în componenta MapView, fără a naviga direct la rezervare.
  const handleMapProviderSelect = (provider: Provider) => {
    setSelectedMapProvider(provider);
  };


  const goToIndex = (index: number) => {
    // ... restul logicii caruselului (neschimbată)
    setActiveIndex(index);
    if (enhancedProviders.length > 0) {
      if (index < centerOffset) {
        setTimeout(() => setActiveIndex(index + enhancedProviders.length), 300);
      } else if (index >= centerOffset + enhancedProviders.length) {
        setTimeout(() => setActiveIndex(index - enhancedProviders.length), 300);
      }
    }
  };
  const handlePrevious = () => goToIndex(activeIndex - 1);
  const handleNext = () => goToIndex(activeIndex + 1);
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;
    const swipeThreshold = 50;
    if (deltaX > swipeThreshold) handlePrevious();
    else if (deltaX < -swipeThreshold) handleNext();
    touchStartX.current = null;
  };
  const getCardStyle = (index: number) => {
    const distance = index - activeIndex;
    const absDistance = Math.abs(distance);
    const sign = Math.sign(distance);
    if (absDistance > 2) return { opacity: 0, transform: `translateX(${sign * 100}%) scale(0.5)`, zIndex: 0, pointerEvents: 'none' as const };
    const translateX = distance * 190;
    const scale = 1 - absDistance * 0.15;
    const rotateY = distance * -20;
    const opacity = 1 - absDistance * 0.25;
    const zIndex = 10 - absDistance;
    return { transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`, opacity, zIndex };
  };
  // ... sfârșitul logicii caruselului

  return (
    <div className="min-h-screen bg-slate-50">
      {/* *** NOU: Randarea notificării *** */}
      {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
      
      <Header 
        onMenuClick={() => setMenuOpen(!menuOpen)} 
        onLogoClick={() => onNavigate('bookings')}
        onNavigate={onNavigate}
      />
      <SearchBar
        onSearch={handleSearch}
        onFilterClick={() => setShowFilters(true)}
        onLocationClick={handleLocationClick}
      />
      
      <SideMenu 
        isOpen={menuOpen} 
        onClose={() => setMenuOpen(false)}
        onNavigate={onNavigate}
      />
      
      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />
      
      <main className="py-6">
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Frizerii Disponibili</h2>
              <p className="text-slate-600 text-sm">
                {loading ? 'Căutare...' : `${enhancedProviders.length} rezultate găsite`}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant={viewMode === 'carousel' ? 'primary' : 'outline'} size="sm" onClick={() => setViewMode('carousel')}>
                <Grid3X3 size={16} className="mr-1" /> Carusel
              </Button>
              <Button variant={viewMode === 'map' ? 'primary' : 'outline'} size="sm" onClick={() => setViewMode('map')}>
                <Map size={16} className="mr-1" /> Hartă
              </Button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Căutăm cele mai bune saloane pentru tine..." />
          </div>
        ) : enhancedProviders.length > 0 ? (
          viewMode === 'carousel' ? (
            // Caruselul rămâne neschimbat
            <div className="relative">
                <div className="relative h-[500px] overflow-hidden">
                    <div ref={carouselRef} className="absolute inset-0 flex items-center justify-center" style={{ perspective: '1500px', transformStyle: 'preserve-3d' }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                        {infiniteProviders.map((provider, index) => (
                            <div key={`${provider.id}-${index}`} className="absolute w-80 transition-all duration-300 ease-out cursor-pointer" style={getCardStyle(index)} onClick={() => index !== activeIndex && goToIndex(index)}>
                                <div style={{ pointerEvents: index === activeIndex ? 'auto' : 'none' }}>
                                    <BarbershopCard provider={provider} onBook={handleBook} onViewMap={handleViewMap} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={handlePrevious} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-white rounded-full p-3 shadow-lg hover:bg-slate-50 transition-all" aria-label="Previous barbershop"><ChevronLeft size={24} /></button>
                    <button onClick={handleNext} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-white rounded-full p-3 shadow-lg hover:bg-slate-50 transition-all" aria-label="Next barbershop"><ChevronRight size={24} /></button>
                </div>
                <div className="flex justify-center gap-2 mt-6">
                    {enhancedProviders.map((_, index) => {
                        const displayIndex = (activeIndex - centerOffset + enhancedProviders.length) % enhancedProviders.length;
                        return ( <button key={index} onClick={() => goToIndex(index + centerOffset)} className={`h-2 rounded-full transition-all ${index === displayIndex ? 'w-8 bg-amber-600' : 'w-2 bg-slate-300 hover:bg-slate-400'}`} aria-label={`Go to slide ${index + 1}`} /> );
                    })}
                </div>
            </div>
          ) : (
            <div className="px-4 h-[600px]">
              <MapView
                providers={enhancedProviders}
                userLocation={userLocation || undefined}
                selectedProvider={selectedMapProvider || undefined}
                // *** MODIFICAT: Pasăm noua funcție de selectare ***
                onProviderSelect={handleMapProviderSelect}
              />
            </div>
          )
        ) : (
          <div className="text-center py-12 px-4">
            <MapPin size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg mb-2">Nu am găsit rezultate</p>
            <p className="text-slate-500 text-sm">Încearcă să modifici criteriile de căutare</p>
          </div>
        )}
        
        {/* Platform Info Module */}
        <div className="mt-12 px-4">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">
              Cum funcționează <span className="text-amber-600">doo mee</span>
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Sparkles className="text-amber-600" size={32} />
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Alegi salonul favorit și serviciul dorit</h4>
                <p className="text-slate-600 text-sm">
                  Alege una din categoriile de mai sus sau cauți după salonul favorit și selectează serviciul dorit
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Clock className="text-amber-600" size={32} />
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Alegi data și ora programării</h4>
                <p className="text-slate-600 text-sm">
                  Vezi disponibilitatea pentru acel serviciu și alegi ziua și ora care ți se potrivesc.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Shield className="text-amber-600" size={32} />
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Confirmi programarea și ești gata!</h4>
                <p className="text-slate-600 text-sm">
                  Specialistul primește direct detaliile programării tale, iar tu vei primi o notificare de reamintire înainte de programare.
                </p>
              </div>
            </div>

            <div className="border-t border-amber-200 pt-6">
              <h4 className="text-lg font-bold text-slate-800 mb-4">Cele mai bune saloane din orașul tău</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-amber-600" />
                  <span className="text-slate-700">Saloane în București</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-amber-600" />
                  <span className="text-slate-700">Saloane în Craiova</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-amber-600" />
                  <span className="text-slate-700">Saloane în Cluj-Napoca</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-amber-600" />
                  <span className="text-slate-700">Saloane în Brașov</span>
                </div>
              </div>
              <button className="text-amber-600 hover:text-amber-700 font-medium text-sm mt-4 transition-colors">
                Vezi mai multe orașe →
              </button>
            </div>

            <div className="border-t border-amber-200 pt-6 mt-6">
              <div className="bg-slate-800 text-white rounded-xl p-6 text-center">
                <h4 className="text-xl font-bold mb-2">Ești specialist beauty sau barber?</h4>
                <p className="text-slate-300 mb-4">
                  Câștigă timp ca să te poți concentra pe clienții tăi. Administrează-ți salonul, clienții și programările din câteva clickuri, fără bătăi de cap.
                </p>
                <button 
                  onClick={() => onNavigate('provider-signup')}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
                >
                  Listează-ți afacerea pe doo mee.ro →
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-8">
              <div className="flex items-center gap-2 text-slate-600">
                <CreditCard size={20} />
                <span className="text-sm">Plăți sigure (Crypto & Fiat)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Shield size={20} />
                <span className="text-sm">Furnizori verificați</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};