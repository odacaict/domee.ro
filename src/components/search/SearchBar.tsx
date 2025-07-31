import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react';
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
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS);
  const searchRef = useRef<HTMLDivElement>(null);
  const { user } = useApp();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length >= 2) {
        try {
          // Verificăm dacă query-ul este un Plus Code
          const isPlusCode = plusCodeHelpers.isValidPlusCode(debouncedQuery);
          
          if (isPlusCode) {
            // Pentru Plus Codes, nu avem nevoie de sugestii suplimentare
            setSuggestions([]);
          } else {
            const results = await searchService.getSearchSuggestions(debouncedQuery);
            setSuggestions(results);
          }
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
        }
      } else {
        setSuggestions([]);
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
        console.log('Căutare Plus Code detectată:', searchQuery);
      }
      
      onSearch(searchQuery);
      setShowSuggestions(false);
      
      // Save to search history
      if (user) {
        searchService.saveSearchHistory(user.id, searchQuery, {}, 0);
      }
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
              icon={<Search size={18} className="text-slate-400" />}
              className={`text-base h-12 ${
                plusCodeHelpers.isValidPlusCode(query) 
                  ? 'border-green-500 bg-green-50' 
                  : ''
              }`}
            />
            {plusCodeHelpers.isValidPlusCode(query) && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Plus Code
                </span>
              </div>
            )}
          </div>
          <SearchSuggestions
            suggestions={suggestions}
            recentSearches={recentSearches}
            onSelect={handleSuggestionSelect}
            visible={showSuggestions}
          />
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
        
        <div className="flex gap-2 text-xs">
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