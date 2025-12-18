"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import SearchFilters, {
  SearchFilters as SearchFiltersType,
} from "@/components/search/SearchFilters";
import SearchResults from "@/components/search/SearchResults";
// import GoogleMap from "@/components/maps/GoogleMap";
// import { GoogleMapsProvider } from "@/components/providers/GoogleMapsProvider"; // Not needed for Leaflet
import dynamic from "next/dynamic";
import NoSSR from "@/components/common/NoSSR";
import { useRouter } from "next/navigation";
import { Room, PaginationInfo, SearchResponse } from "@/types/room";

// Dynamically import LeafletMap to avoid SSR issues with Leaflet
const LeafletMap = dynamic(() => import("@/components/maps/LeafletMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">Loading Map...</div>
});

export default function RoomSearchWrapper() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<SearchFiltersType>({});
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Memoize search parameters to prevent unnecessary API calls
  // Build search params helper
  const buildSearchParams = (filters: SearchFiltersType) => {
    const params = new URLSearchParams();

    if (filters.searchText) params.append("search", filters.searchText);
    if (filters.minRent && !isNaN(filters.minRent) && filters.minRent >= 0)
      params.append("minRent", filters.minRent.toString());
    if (filters.maxRent && !isNaN(filters.maxRent) && filters.maxRent >= 0)
      params.append("maxRent", filters.maxRent.toString());
    if (filters.city) params.append("city", filters.city);
    if (filters.state) params.append("state", filters.state);
    if (filters.roomType) params.append("roomType", filters.roomType);
    if (filters.amenities && filters.amenities.length > 0) {
      params.append("amenities", filters.amenities.join(","));
    }
    if (filters.coordinates) {
      params.append("lat", filters.coordinates.lat.toString());
      params.append("lng", filters.coordinates.lng.toString());
      if (filters.coordinates.radius) {
        params.append("radius", filters.coordinates.radius.toString());
      }
    }

    params.append("sortBy", "createdAt");
    params.append("sortOrder", "desc");
    params.append("includeSampleData", "true");

    return params;
  };

  // Search rooms function
  const searchRooms = useCallback(
    async (filters: SearchFiltersType, page: number = 1) => {
      console.log("🔍 [SEARCH] Starting search with filters:", filters, "page:", page);
      setLoading(true);
      setError(null);

      try {
        const params = buildSearchParams(filters);
        params.set("page", page.toString());
        params.set("limit", "10");

        const apiUrl = `/api/rooms?${params.toString()}`;
        console.log("🔍 [SEARCH] API URL:", apiUrl);
        console.log("🔍 [SEARCH] Fetching rooms...");

        const response = await fetch(apiUrl);
        console.log("🔍 [SEARCH] Response status:", response.status, response.statusText);

        const data: SearchResponse = await response.json();
        console.log("🔍 [SEARCH] Response data:", data);

        if (!response.ok) {
          console.error("🔍 [SEARCH] API error:", data.error);
          throw new Error(data.error?.message || "Failed to search rooms");
        }

        if (data.success) {
          console.log("🔍 [SEARCH] Success! Found", data.data.rooms.length, "rooms");
          console.log("🔍 [SEARCH] Pagination:", data.data.pagination);
          setRooms(data.data.rooms);
          setPagination(data.data.pagination);
          setCurrentFilters(filters);
        } else {
          console.error("🔍 [SEARCH] Search failed:", data.error);
          throw new Error(data.error?.message || "Search failed");
        }
      } catch (err) {
        console.error("🔍 [SEARCH] Error caught:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while searching"
        );
        setRooms([]);
        setPagination({
          page: 1,
          totalPages: 1,
          total: 0,
          limit: 10,
        });
      } finally {
        console.log("🔍 [SEARCH] Search complete, loading:", false);
        setLoading(false);
      }
    },
    []
  );

  // Handle filters change
  const handleFiltersChange = useCallback(
    (filters: SearchFiltersType) => {
      searchRooms(filters, 1);
    },
    [searchRooms]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      searchRooms(currentFilters, page);
    },
    [searchRooms, currentFilters]
  );

  // Handle room click
  const handleRoomClick = useCallback(
    (room: Room) => {
      router.push(`/rooms/${room._id}`);
    },
    [router]
  );

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: "list" | "map") => {
    setViewMode(mode);
  }, []);

  // Load initial results on component mount
  useEffect(() => {
    searchRooms({});
  }, [searchRooms]);

  return (
    <NoSSR
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Find Your Perfect Room
            </h1>
            <p className="mt-2 text-gray-600">
              Discover available rooms in your preferred location with all the
              amenities you need.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Search Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Filters */}
          <SearchFilters
            onFiltersChange={handleFiltersChange}
            loading={loading}
          />

          {/* View Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange("list")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    ></path>
                  </svg>
                  <span>List</span>
                </div>
              </button>
              <button
                onClick={() => handleViewModeChange("map")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === "map"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
                    ></path>
                  </svg>
                  <span>Map</span>
                </div>
              </button>
            </div>

            {rooms.length > 0 && (
              <p className="text-sm text-gray-600">
                {pagination.total} room{pagination.total !== 1 ? "s" : ""}{" "}
                found
              </p>
            )}
          </div>

          {/* Content Area */}
          <div className="relative">
            {/* List View */}
            {viewMode === "list" && (
              <SearchResults
                rooms={rooms}
                pagination={pagination}
                loading={loading}
                onRoomClick={handleRoomClick}
                onPageChange={handlePageChange}
              />
            )}

            {/* Map View */}
            {viewMode === "map" && (
              <div>
                <div className="bg-white rounded-lg shadow-md overflow-hidden h-[600px]">
                  <LeafletMap
                    rooms={rooms}
                    onRoomClick={handleRoomClick}
                    className="w-full h-full"
                  />
                </div>

                {/* Room list sidebar for map view */}
                {rooms.length > 0 && (
                  <div className="mt-6 bg-white rounded-lg shadow-md">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">
                        Rooms on Map ({rooms.length})
                      </h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {rooms.slice(0, 10).map((room) => (
                        <div
                          key={room._id}
                          className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleRoomClick(room)}
                        >
                          <div className="flex items-start space-x-3">
                            {room.images[0] ? (
                              <Image
                                src={room.images[0]}
                                alt={room.title}
                                width={64}
                                height={64}
                                className="w-16 h-16 object-cover rounded-lg shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded-lg shrink-0 flex items-center justify-center">
                                <svg
                                  className="w-6 h-6 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {room.title}
                              </h4>
                              <p className="text-xs text-gray-600 mt-1">
                                {room.location.address}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-lg font-bold text-green-600">
                                  ₹{room.monthlyRent.toLocaleString()}/mo
                                </span>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${room.availability
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                    }`}
                                >
                                  {room.availability ? "Available" : "Booked"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {rooms.length > 10 && (
                        <div className="p-4 text-center text-sm text-gray-600">
                          And {rooms.length - 10} more rooms...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>)}
          </div>
        </div>
      </div>
    </NoSSR>
  );
}
