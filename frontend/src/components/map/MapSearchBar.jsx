import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, MapPin, Loader2 } from 'lucide-react';

// Geocode search using Nominatim — restricts to NER India
async function geocodeSearch(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)},North East India&format=json&limit=6&countrycodes=in&viewbox=88,19,98,30&bounded=0&addressdetails=1`;
  const r = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'LandslideRiskSystem/1.0' } });
  const data = await r.json();
  return data.map(item => ({
    name: item.display_name,
    short: item.address?.city || item.address?.town || item.address?.village || item.address?.county || item.name,
    state: item.address?.state,
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    type: item.type
  })).filter(item => item.lat >= 20 && item.lat <= 30 && item.lon >= 88 && item.lon <= 98);
}

export default function MapSearchBar({ onLocationSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const handleInput = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    setResults([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) return;

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const hits = await geocodeSearch(val);
        setResults(hits);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 450);
  }, []);

  const handleSelect = (item) => {
    setQuery(item.short || item.name);
    setResults([]);
    setFocused(false);
    onLocationSelect(item.lat, item.lon, item.short);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  // Quick NER shortcuts
  const QUICK = [
    { name: 'East Sikkim', lat: 27.33, lon: 88.62 },
    { name: 'Cherrapunji', lat: 25.27, lon: 91.73 },
    { name: 'Noney, Manipur', lat: 24.81, lon: 93.68 },
    { name: 'Aizawl', lat: 23.73, lon: 92.72 },
    { name: 'Kohima', lat: 25.67, lon: 94.12 },
  ];

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-80">
      <div className={`flex items-center bg-[#0a0e1a]/95 border rounded-lg backdrop-blur-sm shadow-xl transition-all ${focused ? 'border-white/20' : 'border-white/8'}`}>
        <Search size={14} className="ml-3 text-gray-500 flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={handleInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="Search location in NER India..."
          className="flex-1 px-2 py-2.5 bg-transparent text-xs text-gray-200 placeholder-gray-600 outline-none"
        />
        {loading && <Loader2 size={12} className="mr-2 text-gray-500 animate-spin" />}
        {query && !loading && (
          <button onClick={handleClear} className="mr-2 text-gray-600 hover:text-gray-300">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {(focused && (results.length > 0 || (!query && !loading))) && (
        <div className="mt-1 bg-[#0a0e1a]/98 border border-white/8 rounded-lg shadow-xl overflow-hidden">
          {!query && (
            <>
              <div className="px-3 py-1.5 text-[9px] text-gray-600 uppercase tracking-wider border-b border-white/5">Quick Access — High Risk Zones</div>
              {QUICK.map(loc => (
                <button
                  key={loc.name}
                  onMouseDown={() => handleSelect({ lat: loc.lat, lon: loc.lon, short: loc.name })}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/4 transition-colors text-left"
                >
                  <MapPin size={10} className="text-red-500 flex-shrink-0" />
                  <span className="text-xs text-gray-300">{loc.name}</span>
                  <span className="ml-auto text-[9px] text-gray-600 font-mono">{loc.lat.toFixed(2)}°N</span>
                </button>
              ))}
            </>
          )}

          {results.length > 0 && results.map((item, i) => (
            <button
              key={i}
              onMouseDown={() => handleSelect(item)}
              className="w-full flex items-start gap-2 px-3 py-2 hover:bg-white/4 transition-colors text-left border-t border-white/3"
            >
              <MapPin size={10} className="text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-300 truncate">{item.short}</div>
                <div className="text-[9px] text-gray-600 truncate">{item.state}</div>
              </div>
              <span className="text-[9px] text-gray-700 font-mono flex-shrink-0">{item.lat.toFixed(2)}°N</span>
            </button>
          ))}

          {query && results.length === 0 && !loading && (
            <div className="px-3 py-3 text-[10px] text-gray-600 text-center">No results in NER India</div>
          )}
        </div>
      )}
    </div>
  );
}
