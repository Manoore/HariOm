import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import api from '../lib/api';

/**
 * AddressAutocomplete Component
 * A reusable address input with Google Places autocomplete
 * 
 * Props:
 * - value: Current address value
 * - onChange: Callback when address changes (receives full address object)
 * - onSelect: Callback when a place is selected (receives place details)
 * - placeholder: Input placeholder text
 * - className: Additional CSS classes
 * - inputClassName: CSS classes for the input element
 * - disabled: Whether the input is disabled
 * - label: Label text (optional)
 * - required: Whether the field is required
 * - testId: data-testid attribute
 */
const AddressAutocomplete = ({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Start typing your address...',
  className = '',
  inputClassName = '',
  disabled = false,
  label,
  required = false,
  testId = 'address-autocomplete'
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Update internal state when value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions from API
  const fetchSuggestions = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/api/places/autocomplete?query=${encodeURIComponent(searchQuery)}`);
      if (response.data.status === 'ok') {
        setSuggestions(response.data.results || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setSelectedIndex(-1);
    
    // Notify parent of text change
    if (onChange) {
      onChange(newValue);
    }

    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  // Handle place selection
  const handleSelectPlace = async (place) => {
    setQuery(place.description);
    setShowSuggestions(false);
    setSuggestions([]);

    // Notify parent of text change
    if (onChange) {
      onChange(place.description);
    }

    // Fetch full details if onSelect callback provided
    if (onSelect && place.place_id) {
      try {
        const response = await api.get(`/api/places/details/${place.place_id}`);
        if (response.data.status === 'ok') {
          onSelect({
            address: place.description,
            ...response.data.data
          });
        }
      } catch (error) {
        console.error('Error fetching place details:', error);
        // Still call onSelect with basic info
        onSelect({
          address: place.description,
          main_text: place.main_text,
          secondary_text: place.secondary_text
        });
      }
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectPlace(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  // Clear input
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (onChange) onChange('');
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <MapPin className="w-5 h-5" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          } ${inputClassName}`}
          data-testid={testId}
          autoComplete="off"
        />

        {/* Loading or Clear button */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : query && !disabled ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              data-testid={`${testId}-clear`}
            >
              <X className="w-5 h-5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-orange-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((place, index) => (
            <button
              key={place.place_id}
              type="button"
              onClick={() => handleSelectPlace(place)}
              className={`w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors flex items-start gap-3 ${
                index === selectedIndex ? 'bg-orange-50' : ''
              } ${index === 0 ? 'rounded-t-xl' : ''} ${
                index === suggestions.length - 1 ? 'rounded-b-xl' : 'border-b border-orange-100'
              }`}
              data-testid={`${testId}-suggestion-${index}`}
            >
              <MapPin className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-800">{place.main_text}</p>
                <p className="text-sm text-gray-500">{place.secondary_text}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && !isLoading && query.length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-orange-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
          No addresses found. Try a different search.
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
