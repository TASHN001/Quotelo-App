import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { COUNTRIES, CountryData } from '../lib/countryData';

interface CountrySelectProps {
  value: string;
  onChange: (country: CountryData) => void;
  label?: string;
  required?: boolean;
}

export default function CountrySelect({ value, onChange, label, required }: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = COUNTRIES.find(c => c.code === value || c.name === value);

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (country: CountryData) => {
    onChange(country);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {selectedCountry ? (
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedCountry.flag}</span>
            <span className="text-gray-900">{selectedCountry.name}</span>
          </div>
        ) : (
          <span className="text-gray-500">Select a country</span>
        )}
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-[400px] overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-[340px]">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-100 transition-colors ${
                    selectedCountry?.code === country.code
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-900'
                  }`}
                >
                  <span className="text-2xl">{country.flag}</span>
                  <span className="flex-1">{country.name}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
