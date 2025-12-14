"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat",
  "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna",
  "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Varanasi", "Srinagar",
  "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad", "Ranchi", "Howrah", "Coimbatore", "Jabalpur",
  "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh", "Solapur",
  "Hubli-Dharwad", "Bareilly", "Moradabad", "Mysore", "Gurgaon", "Aligarh", "Jalandhar", "Tiruchirappalli",
  "Bhubaneswar", "Salem", "Warangal", "Thiruvananthapuram", "Noida"
];

export interface SearchFilters {
  searchText?: string;
  minRent?: number;
  maxRent?: number;
  city?: string;
  state?: string;
  roomType?: string;
  amenities?: string[];
  coordinates?: {
    lat: number;
    lng: number;
    radius?: number;
  };
}

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  loading?: boolean;
}

export default function SearchFilters({
  onFiltersChange,
  loading,
}: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Local state for search location input handling
  const [locationInput, setLocationInput] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Keep a ref to the callback to avoid effect dependencies on unstable props
  const onFiltersChangeRef = useRef(onFiltersChange);

  useEffect(() => {
    onFiltersChangeRef.current = onFiltersChange;
  }, [onFiltersChange]);

  const handleFilterChange = useCallback((
    key: keyof SearchFilters,
    value: string | number | string[] | undefined
  ) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      onFiltersChangeRef.current(newFilters);
      return newFilters;
    });
  }, []);

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only trigger if the input differs from the current applied filter
      // AND we haven't selected a specific city (which is handled separately)
      if (locationInput !== filters.searchText && !filters.city) {
        handleFilterChange("searchText", locationInput);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [locationInput, filters.searchText, filters.city, handleFilterChange]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocationType = useCallback((value: string) => {
    setLocationInput(value);

    // Filter suggestions
    if (value.trim().length > 0) {
      const filtered = INDIAN_CITIES.filter(city =>
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setLocationSuggestions(filtered);
      setShowSuggestions(true);

      // If the user clears the input, and city was set, clear it
      // Accessing current filters state inside callback might be stale if not careful, 
      // but 'filters' is in scope. To be safe, we check value.
      if (value === "") {
        setFilters(prev => {
          if (prev.city) {
            const newFilters = { ...prev, city: undefined, searchText: "" };
            onFiltersChangeRef.current(newFilters);
            return newFilters;
          }
          // If just clearing text
          const newFilters = { ...prev, searchText: "" };
          onFiltersChangeRef.current(newFilters);
          return newFilters;
        });
      }
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      // Clear filters immediately if input cleared
      setFilters(prev => {
        const newFilters = { ...prev, searchText: "", city: undefined };
        onFiltersChangeRef.current(newFilters);
        return newFilters;
      });
    }
  }, []); // filters dependency intentionally omitted to avoid recreation, logic inside setFilters handles it? 
  // No, setFilters updater sees prev. But the 'if (value === "")' check is fine.

  const selectCity = useCallback((city: string) => {
    setLocationInput(city);
    setShowSuggestions(false);

    setFilters((prev) => {
      const newFilters = { ...prev, city: city, searchText: undefined };
      onFiltersChangeRef.current(newFilters);
      return newFilters;
    });
  }, []);

  const handleAmenityToggle = useCallback((amenity: string) => {
    setFilters((prev) => {
      const currentAmenities = prev.amenities || [];
      const newAmenities = currentAmenities.includes(amenity)
        ? currentAmenities.filter((a) => a !== amenity)
        : [...currentAmenities, amenity];

      const newFilters = { ...prev, amenities: newAmenities };
      onFiltersChangeRef.current(newFilters);
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setLocationInput("");
    onFiltersChangeRef.current({});
  }, []);

  const commonAmenities = [
    "WiFi",
    "AC",
    "Parking",
    "Laundry",
    "Kitchen",
    "Balcony",
    "Furnished",
    "Security",
    "Gym",
    "Swimming Pool",
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Search Location with Autocomplete */}
        <div className="relative" ref={wrapperRef}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City / Location
          </label>
          <input
            type="text"
            placeholder="Type a city name..."
            value={locationInput}
            onChange={(e) => handleLocationType(e.target.value)}
            onFocus={() => {
              if (locationInput) setShowSuggestions(true);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && locationSuggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {locationSuggestions.map((city) => (
                <li
                  key={city}
                  onClick={() => selectCity(city)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 font-medium border-b last:border-b-0 border-gray-100"
                >
                  {city}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Min Rent */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Rent (₹)
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            placeholder="5000"
            value={filters.minRent || ""}
            onChange={(e) => {
              const value = e.target.value.trim();
              const numValue = value ? parseInt(value) : undefined;
              handleFilterChange(
                "minRent",
                numValue && !isNaN(numValue) && numValue >= 0
                  ? numValue
                  : undefined
              );
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
          />
        </div>

        {/* Max Rent */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Rent (₹)
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            placeholder="50000"
            value={filters.maxRent || ""}
            onChange={(e) => {
              const value = e.target.value.trim();
              const numValue = value ? parseInt(value) : undefined;
              handleFilterChange(
                "maxRent",
                numValue && !isNaN(numValue) && numValue >= 0
                  ? numValue
                  : undefined
              );
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
          />
        </div>

        {/* Room Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Room Type
          </label>
          <select
            value={filters.roomType || ""}
            onChange={(e) =>
              handleFilterChange("roomType", e.target.value || undefined)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
          >
            <option value="">All Types</option>
            <option value="single">Single Room</option>
            <option value="double">Double Room</option>
            <option value="shared">Shared Room</option>
            <option value="studio">Studio</option>
            <option value="1bhk">1 BHK</option>
            <option value="2bhk">2 BHK</option>
            <option value="3bhk">3 BHK</option>
            <option value="pg">PG</option>
            <option value="hostel">Hostel</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4 flex items-center"
      >
        <span className="mr-1">{showAdvanced ? "Hide" : "Show"} Advanced Filters</span>
        <svg className={`w-4 h-4 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showAdvanced && (
        <div className="border-t pt-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Note: City is primarily handled in the main bar now, but State is here */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                placeholder="Maharashtra, Karnataka..."
                value={filters.state || ""}
                onChange={(e) => handleFilterChange("state", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
              />
            </div>
            {/* Additional filters can go here */}
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amenities
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {commonAmenities.map((amenity) => (
                <label
                  key={amenity}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={(filters.amenities || []).includes(amenity)}
                    onChange={() => handleAmenityToggle(amenity)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-sm text-gray-700 select-none">{amenity}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clear Filters */}
      <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={clearFilters}
          disabled={loading}
          className="flex items-center space-x-1 px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Clear All Filters</span>
        </button>
      </div>
    </div>
  );
}
