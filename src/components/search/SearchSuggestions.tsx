import React from 'react';
import { Search, Clock, MapPin } from 'lucide-react';

interface SearchSuggestionsProps {
  suggestions: string[];
  recentSearches?: string[];
  onSelect: (query: string) => void;
  visible: boolean;
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  suggestions,
  recentSearches = [],
  onSelect,
  visible
}) => {
  if (!visible || (suggestions.length === 0 && recentSearches.length === 0)) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 max-h-96 overflow-y-auto z-50">
      {suggestions.length > 0 && (
        <div className="p-2">
          <p className="text-xs text-slate-500 px-3 py-1 font-medium">Sugestii</p>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSelect(suggestion)}
              className="w-full text-left px-3 py-2 hover:bg-amber-50 rounded-md flex items-center gap-2 group"
            >
              <Search size={16} className="text-slate-400 group-hover:text-amber-600" />
              <span className="text-sm text-slate-700 group-hover:text-slate-900">{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {recentSearches.length > 0 && (
        <div className="p-2 border-t border-slate-100">
          <p className="text-xs text-slate-500 px-3 py-1 font-medium">Căutări recente</p>
          {recentSearches.map((search, index) => (
            <button
              key={index}
              onClick={() => onSelect(search)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-md flex items-center gap-2 group"
            >
              <Clock size={16} className="text-slate-400" />
              <span className="text-sm text-slate-600 group-hover:text-slate-700">{search}</span>
            </button>
          ))}
        </div>
      )}

      <div className="p-2 border-t border-slate-100">
        <button
          className="w-full text-left px-3 py-2 hover:bg-amber-50 rounded-md flex items-center gap-2 group"
          onClick={() => onSelect('saloane lângă mine')}
        >
          <MapPin size={16} className="text-amber-600" />
          <span className="text-sm font-medium text-amber-600">Saloane lângă mine</span>
        </button>
      </div>
    </div>
  );
};