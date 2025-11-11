"use client";

import { useState } from "react";

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

  const handleFilterChange = (
    key: keyof SearchFilters,
    value: string | number | string[] | undefined
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleAmenityToggle = (amenity: string) => {
    const currentAmenities = filters.amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a) => a !== amenity)
      : [...currentAmenities, amenity];

    handleFilterChange("amenities", newAmenities);
  };

  const clearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

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
        {/* Search Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Location
          </label>
          <input
            type="text"
            placeholder="City, area, or landmark"
            value={filters.searchText || ""}
            onChange={(e) => handleFilterChange("searchText", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="single">Single Room</option>
            <option value="shared">Shared Room</option>
            <option value="studio">Studio</option>
            <option value="1bhk">1 BHK</option>
            <option value="2bhk">2 BHK</option>
            <option value="3bhk">3 BHK</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
      >
        {showAdvanced ? "Hide" : "Show"} Advanced Filters
      </button>

      {showAdvanced && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                placeholder="Mumbai, Delhi, Bangalore..."
                value={filters.city || ""}
                onChange={(e) => handleFilterChange("city", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                placeholder="Maharashtra, Karnataka..."
                value={filters.state || ""}
                onChange={(e) => handleFilterChange("state", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={(filters.amenities || []).includes(amenity)}
                    onChange={() => handleAmenityToggle(amenity)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{amenity}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clear Filters */}
      <div className="flex justify-end mt-4">
        <button
          onClick={clearFilters}
          disabled={loading}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
}
