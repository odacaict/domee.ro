import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, SlidersHorizontal, Map, CheckCircle } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { SearchSuggestions } from './SearchSuggestions';
import { useDebounce } from '../../hooks/useDebounce';
import { searchService } from '../../services/searchService';
import { plusCodeHelpers } from '../../utils/plusCodeHelpers';
import { useApp } from '../../contexts/AppContext';
import { SEARCH_DEBOUNCE_MS } from '../../utils/constants';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterClick: () => void;
  onLocationClick: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onFilterClick,
  onLocationClick,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationPermissionRequested, setLocationPermissionRequested] = useState(false);
  const [isPlusCodeValid, setIsPlusCodeValid] = useState(false);
  const [plusCodeLocation, setPlusCodeLocation] = useState<string>('');
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS);
  const searchRef = useRef<HTMLDivElement>(null);
  const { user } = useApp();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length >= 2) {
        try {
          // Verificăm dacă query-ul este un Plus Code
          const isPlusCode = plusCodeHelpers.isValidPlusCode(debouncedQuery);
          setIsPlusCodeValid(isPlusCode);
          
          if (isPlusCode) {
            // Pentru Plus Codes, încercăm să obținem locația
            try {
              const location = await plusCodeHelpers.decodeToLocation(debouncedQuery);
              setPlusCodeLocation(location);
            } catch (error) {
              console.warn('Nu s-a putut decoda Plus Code-ul:', error);
              setPlusCodeLocation('Locație necunoscută');
            }
            setSuggestions([]);
          } else {
            setPlusCodeLocation('');
            const results = await searchService.getSearchSuggestions(debouncedQuery);
            setSuggestions(results);
          }
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
        }
      } else {
        setSuggestions([]);
        setIsPlusCodeValid(false);
        setPlusCodeLocation('');
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  useEffect(() => {
    const fetchRecentSearches = async () => {
      if (user) {
        try {
          const searches = await searchService.getRecentSearches(user.id);
          setRecentSearches(searches);
        } catch (error) {
          console.error('Failed to fetch recent searches:', error);
        }
      }
    };

    fetchRecentSearches();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string = query) => {
    if (searchQuery.trim()) {
      // Verificăm dacă este un Plus Code
      const isPlusCode = plusCodeHelpers.isValidPlusCode(searchQuery);
      if (isPlusCode) {
        console.log('Căutare Plus Code detectată:', searchQuery, 'Locație:', plusCodeLocation);
        // Pentru Plus Code, adăugăm informații suplimentare în istoric
        if (user) {
          searchService.saveSearchHistory(user.id, searchQuery, { 
            type: 'plus_code', 
            location: plusCodeLocation 
          }, 0);
        }
      } else {
        // Pentru căutări normale
        if (user) {
          searchService.saveSearchHistory(user.id, searchQuery, { type: 'text_search' }, 0);
        }
      }
      
      onSearch(searchQuery);
      setShowSuggestions(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleLocationClick = () => {
    if (!locationPermissionRequested) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('Location granted:', position.coords);
            setLocationPermissionRequested(true);
            onLocationClick();
          },
          (error) => {
            console.error('Location denied:', error);
            let errorMessage = 'Nu s-a putut obține locația';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Accesul la locație a fost refuzat. Verifică setările browserului.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Informațiile despre locație nu sunt disponibile.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Cererea de locație a expirat. Încearcă din nou.';
                break;
            }
            alert(errorMessage);
          }
        );
      } else {
        alert('Browserul tău nu suportă geolocalizare.');
      }
    } else {
      onLocationClick();
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  return (
    <div className="bg-white p-4 shadow-sm border-b border-slate-100">
      <div className="flex gap-3 mb-3">
        <div className="flex-1 relative" ref={searchRef}>
          <div className="relative">
            <Input
              placeholder="Caută frizerii, saloane, servicii sau Plus Code..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyPress={handleKeyPress}
              icon={isPlusCodeValid ? (
                <Map size={18} className="text-emerald-600" />
              ) : (
                <Search size={18} className="text-slate-400" />
              )}
              className={`text-base h-12 transition-all duration-200 ${
                isPlusCodeValid
                  ? 'border-emerald-500 bg-emerald-50 shadow-emerald-100 shadow-md' 
                  : ''
              }`}
            />
            {isPlusCodeValid && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-600" />
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-medium">
                  Plus Code Valid
                </span>
              </div>
            )}
          </div>
          
          {/* Plus Code Location Display */}
          {isPlusCodeValid && plusCodeLocation && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-emerald-50 border border-emerald-200 rounded-lg p-3 shadow-md z-10">
              <div className="flex items-center gap-2 text-emerald-800">
                <MapPin size={14} className="text-emerald-600" />
                <span className="text-sm font-medium">Locația detectată:</span>
              </div>
              <p className="text-emerald-700 text-sm mt-1 font-medium">{plusCodeLocation}</p>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-emerald-600">Gata pentru căutare în această zonă</span>
              </div>
            </div>
          )}
          
                     {/* Regular Suggestions */}
           {!isPlusCodeValid && (
             <SearchSuggestions
               suggestions={suggestions}
               recentSearches={recentSearches}
               onSelect={handleSuggestionSelect}
               visible={showSuggestions}
             />
           )}
        </div>
        <Button
          variant="outline"
          onClick={onFilterClick}
          className="px-4 h-12"
          aria-label="Deschide filtre"
        >
          <SlidersHorizontal size={18} />
        </Button>
      </div>
      
      <div className="flex items-center justify-between">
        <button 
          onClick={handleLocationClick}
          className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium text-sm transition-colors"
        >
          <MapPin size={16} />
          {locationPermissionRequested ? 'Actualizează locația' : 'Folosește locația mea'}
        </button>
        
        <div className="flex gap-2 text-xs items-center">
          {isPlusCodeValid && (
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1">
              <Map size={12} />
              Plus Code Valid
            </span>
          )}
          <span className="px-2 py-1 bg-slate-100 rounded-full text-slate-600">
            Disponibil acum
          </span>
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
            Verificat
          </span>
        </div>
      </div>
    </div>
  );
};