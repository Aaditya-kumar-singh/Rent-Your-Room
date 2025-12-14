"use client";

import { useEffect, useRef, useCallback } from "react";
import { useGoogleMaps } from "@/components/providers/GoogleMapsProvider";
import { Room } from "@/types/room";

interface GoogleMapProps {
  rooms: Room[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onRoomClick?: (room: Room) => void;
  className?: string;
}

declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}

const GoogleMap: React.FC<GoogleMapProps> = ({
  rooms,
  center = { lat: 20.5937, lng: 78.9629 }, // Center of India
  zoom = 6,
  onRoomClick,
  className = "w-full h-96",
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const { isLoaded, isLoading, error } = useGoogleMaps();

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google || !isLoaded) return;

    try {
      // Create map with optimized settings
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        gestureHandling: "cooperative", // Better mobile experience
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
        // Performance optimizations
        maxZoom: 18,
        minZoom: 3,
        restriction: {
          latLngBounds: {
            north: 37.0,
            south: 6.0,
            west: 68.0,
            east: 98.0,
          }, // Restrict to India bounds
        },
      });

      // Create info window with better styling
      infoWindowRef.current = new window.google.maps.InfoWindow({
        maxWidth: 300,
        pixelOffset: new window.google.maps.Size(0, -10),
      });

      console.log("Map initialized successfully");
    } catch (err) {
      console.error("Error initializing map:", err);
      // Could emit an error event here for parent component to handle
    }
  }, [center, zoom, isLoaded]);

  // Clear existing markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current = [];
  }, []);

  // Create room markers
  const createMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !window.google || rooms.length === 0) return;

    clearMarkers();

    rooms.forEach((room) => {
      if (
        !room.location?.coordinates?.coordinates ||
        room.location.coordinates.coordinates.length !== 2
      ) {
        return;
      }

      const [lng, lat] = room.location.coordinates.coordinates;

      // Create marker
      const marker = new window.google.maps.Marker({
        position: {
          lat: lat,
          lng: lng,
        },
        map: mapInstanceRef.current,
        title: room.title,
        icon: {
          url: room.availability
            ? "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="12" fill="#10B981" stroke="#ffffff" stroke-width="2"/>
                  <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">₹</text>
                </svg>
              `)
            : "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="12" fill="#EF4444" stroke="#ffffff" stroke-width="2"/>
                  <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">₹</text>
                </svg>
              `),
          scaledSize: new window.google.maps.Size(32, 32),
        },
      });

      // Create info window content
      const infoContent = `
        <div class="p-3 max-w-sm">
          <div class="flex items-start space-x-3">
            ${
              room.images[0]
                ? `<img src="${room.images[0]}" alt="${room.title}" class="w-16 h-16 object-cover rounded-lg shrink-0" />`
                : `<div class="w-16 h-16 bg-gray-200 rounded-lg shrink-0 flex items-center justify-center">
                     <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                     </svg>
                   </div>`
            }
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-semibold text-gray-900 truncate">${
                room.title
              }</h3>
              <p class="text-xs text-gray-600 mt-1">${room.location.address}</p>
              <div class="flex items-center justify-between mt-2">
                <span class="text-lg font-bold text-green-600">₹${room.monthlyRent.toLocaleString()}/mo</span>
                <span class="text-xs px-2 py-1 rounded-full ${
                  room.availability
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }">
                  ${room.availability ? "Available" : "Booked"}
                </span>
              </div>
              <div class="flex items-center mt-2 space-x-2">
                <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${
                  room.roomType
                }</span>
                <span class="text-xs text-gray-500">${
                  room.amenities.length
                } amenities</span>
              </div>
            </div>
          </div>
        </div>
      `;

      // Add click listener
      marker.addListener("click", () => {
        if (infoWindowRef.current && mapInstanceRef.current) {
          infoWindowRef.current.setContent(infoContent);
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        }

        // Call onRoomClick if provided
        if (onRoomClick) {
          onRoomClick(room);
        }
      });

      markersRef.current.push(marker);
    });

    // Fit map to show all markers if there are any
    if (markersRef.current.length > 0 && mapInstanceRef.current) {
      const bounds = new window.google.maps.LatLngBounds();
      markersRef.current.forEach((marker) => {
        const position = marker.getPosition();
        if (position) {
          bounds.extend(position);
        }
      });
      mapInstanceRef.current.fitBounds(bounds);

      // Set max zoom to avoid zooming too close
      const listener = window.google.maps.event.addListener(
        mapInstanceRef.current,
        "idle",
        () => {
          if (mapInstanceRef.current) {
            const zoom = mapInstanceRef.current.getZoom();
            if (zoom && zoom > 15) {
              mapInstanceRef.current.setZoom(15);
            }
          }
          window.google.maps.event.removeListener(listener);
        }
      );
    }
  }, [rooms, onRoomClick, clearMarkers]);

  // Initialize map when loaded
  useEffect(() => {
    if (isLoaded) {
      initializeMap();
    }
  }, [isLoaded, initializeMap]);

  // Update markers when rooms change
  useEffect(() => {
    if (isLoaded && mapInstanceRef.current) {
      createMarkers();
    }
  }, [isLoaded, rooms, createMarkers]);

  if (error) {
    return (
      <div
        className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`}
      >
        <div className="text-center p-6">
          <svg
            className="mx-auto h-12 w-12 text-red-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Map Error</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !isLoaded) {
    return (
      <div
        className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`}
      >
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Loading Map
          </h3>
          <p className="text-gray-600">Please wait while we load the map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className={className} />
      {rooms.length > 0 && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md px-3 py-2">
          <p className="text-sm font-medium text-gray-900">
            {rooms.length} room{rooms.length !== 1 ? "s" : ""} found
          </p>
        </div>
      )}
    </div>
  );
};

export default GoogleMap;
