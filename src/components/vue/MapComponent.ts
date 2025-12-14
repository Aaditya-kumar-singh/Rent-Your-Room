import { defineComponent, ref, onMounted, nextTick, watch } from "vue";

// Declare global google maps types
declare global {
  interface Window {
    google: typeof google;
    __NEXT_PUBLIC_GOOGLE_MAPS_API_KEY__?: string;
  }
}

// Define interfaces
interface Room {
  _id: string;
  title: string;
  monthlyRent: number;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    city: string;
    state: string;
  };
  images: string[];
  roomType: string;
  availability: boolean;
}

interface MapMarker {
  marker: google.maps.Marker;
  infoWindow: google.maps.InfoWindow;
  room: Room;
}

export default defineComponent({
  name: "MapComponent",
  props: {
    rooms: {
      type: Array as () => Room[],
      required: true,
    },
    center: {
      type: Object as () => { lat: number; lng: number },
      default: () => ({ lat: 19.076, lng: 72.8777 }), // Mumbai default
    },
    zoom: {
      type: Number,
      default: 12,
    },
    height: {
      type: String,
      default: "400px",
    },
    onRoomSelect: {
      type: Function as unknown as () => (room: Room) => void,
      required: true,
    },
    selectedRoomId: {
      type: String,
      default: null,
    },
  },
  setup(props) {
    const mapContainer = ref<HTMLElement>();
    const mapLoaded = ref(false);
    const mapError = ref<string | null>(null);

    let map: google.maps.Map | null = null;
    let markers: MapMarker[] = [];

    // Initialize Google Maps
    const initializeMap = async () => {
      try {
        // Check if Google Maps API key is available
        const apiKey =
          window.__NEXT_PUBLIC_GOOGLE_MAPS_API_KEY__ ||
          process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
          mapError.value = "Google Maps API key not configured";
          showMapFallback();
          return;
        }

        // Load Google Maps script if not already loaded
        if (typeof google === "undefined") {
          await loadGoogleMapsScript();
        }

        await nextTick();

        if (!mapContainer.value) return;

        // Create map
        map = new google.maps.Map(mapContainer.value, {
          zoom: props.zoom,
          center: props.center,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        // Add markers for rooms
        addRoomMarkers();

        mapLoaded.value = true;
      } catch (error) {
        console.error("Error initializing map:", error);
        mapError.value = "Failed to load Google Maps";
        showMapFallback();
      }
    };

    // Load Google Maps script
    const loadGoogleMapsScript = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (typeof google !== "undefined") {
          resolve();
          return;
        }

        const apiKey =
          window.__NEXT_PUBLIC_GOOGLE_MAPS_API_KEY__ ||
          process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
          reject(new Error("Google Maps API key not configured"));
          return;
        }

        // Check if script is already loading
        const existingScript = document.querySelector(
          'script[src*="maps.googleapis.com"]'
        );
        if (existingScript) {
          existingScript.addEventListener("load", () => resolve());
          existingScript.addEventListener("error", () =>
            reject(new Error("Failed to load Google Maps"))
          );
          return;
        }

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          setTimeout(() => resolve(), 100);
        };

        script.onerror = () => reject(new Error("Failed to load Google Maps"));

        document.head.appendChild(script);
      });
    };

    // Show fallback when map fails to load
    const showMapFallback = () => {
      if (mapContainer.value) {
        mapContainer.value.innerHTML = `
          <div class="flex items-center justify-center h-full bg-gray-100 rounded-md border">
            <div class="text-center p-6">
              <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"></path>
              </svg>
              <p class="text-gray-600 mb-2">Map unavailable</p>
              <p class="text-sm text-gray-500">${
                mapError.value || "Unable to load map"
              }</p>
            </div>
          </div>
        `;
      }
    };

    // Add markers for all rooms
    const addRoomMarkers = () => {
      if (!map) return;

      // Clear existing markers
      clearMarkers();

      // Add marker for each room
      props.rooms.forEach((room) => {
        if (room.location.coordinates.lat && room.location.coordinates.lng) {
          addRoomMarker(room);
        }
      });

      // Fit map to show all markers
      if (markers.length > 0) {
        fitMapToMarkers();
      }
    };

    // Add a single room marker
    const addRoomMarker = (room: Room) => {
      if (!map) return;

      const position = {
        lat: room.location.coordinates.lat,
        lng: room.location.coordinates.lng,
      };

      // Create marker
      const marker = new google.maps.Marker({
        position: position,
        map: map,
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
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16),
        },
      });

      // Create info window content
      const infoWindowContent = `
        <div class="p-3 max-w-xs">
          <div class="flex items-start space-x-3">
            <img 
              src="${room.images[0] || "/placeholder-room.jpg"}" 
              alt="${room.title}"
              class="w-16 h-16 object-cover rounded-md"
            />
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-semibold text-gray-900 truncate">${
                room.title
              }</h3>
              <p class="text-xs text-gray-600 mb-1">${room.location.city}, ${
        room.location.state
      }</p>
              <p class="text-lg font-bold text-blue-600">₹${room.monthlyRent.toLocaleString()}</p>
              <p class="text-xs text-gray-500">${room.roomType}</p>
              <div class="mt-2">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  room.availability
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }">
                  ${room.availability ? "Available" : "Not Available"}
                </span>
              </div>
            </div>
          </div>
          <button 
            onclick="window.selectRoom('${room._id}')"
            class="mt-3 w-full bg-blue-600 text-white text-xs py-2 px-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            View Details
          </button>
        </div>
      `;

      // Create info window
      const infoWindow = new google.maps.InfoWindow({
        content: infoWindowContent,
      });

      // Add click listener to marker
      marker.addListener("click", () => {
        // Close all other info windows
        markers.forEach((m) => m.infoWindow.close());

        // Open this info window
        infoWindow.open(map, marker);

        // Highlight selected room
        props.onRoomSelect(room);
      });

      // Store marker reference
      markers.push({
        marker,
        infoWindow,
        room,
      });
    };

    // Clear all markers
    const clearMarkers = () => {
      markers.forEach((markerData) => {
        markerData.marker.setMap(null);
        markerData.infoWindow.close();
      });
      markers = [];
    };

    // Fit map to show all markers
    const fitMapToMarkers = () => {
      if (!map || markers.length === 0) return;

      if (markers.length === 1) {
        // If only one marker, center on it
        map.setCenter(markers[0].marker.getPosition()!);
        map.setZoom(15);
      } else {
        // If multiple markers, fit bounds
        const bounds = new google.maps.LatLngBounds();
        markers.forEach((markerData) => {
          bounds.extend(markerData.marker.getPosition()!);
        });
        map.fitBounds(bounds);

        // Ensure minimum zoom level
        const listener = google.maps.event.addListener(map, "idle", () => {
          if (map!.getZoom()! > 16) map!.setZoom(16);
          google.maps.event.removeListener(listener);
        });
      }
    };

    // Highlight selected room marker
    const highlightSelectedRoom = () => {
      if (!props.selectedRoomId) return;

      const selectedMarker = markers.find(
        (m) => m.room._id === props.selectedRoomId
      );

      if (selectedMarker) {
        // Close all info windows
        markers.forEach((m) => m.infoWindow.close());

        // Open selected room's info window
        selectedMarker.infoWindow.open(map, selectedMarker.marker);

        // Center map on selected marker
        map?.setCenter(selectedMarker.marker.getPosition()!);
      }
    };

    // Global function for room selection from info window
    (
      window as typeof window & { selectRoom: (roomId: string) => void }
    ).selectRoom = (roomId: string) => {
      const room = props.rooms.find((r) => r._id === roomId);
      if (room) {
        props.onRoomSelect(room);
      }
    };

    // Watch for changes in rooms
    watch(
      () => props.rooms,
      () => {
        if (map) {
          addRoomMarkers();
        }
      },
      { deep: true }
    );

    // Watch for changes in selected room
    watch(
      () => props.selectedRoomId,
      () => {
        highlightSelectedRoom();
      }
    );

    // Watch for center changes
    watch(
      () => props.center,
      (newCenter) => {
        if (map) {
          map.setCenter(newCenter);
        }
      },
      { deep: true }
    );

    // Initialize map on mount
    onMounted(() => {
      initializeMap();
    });

    return {
      mapContainer,
      mapLoaded,
      mapError,
    };
  },
  template: `
    <div class="relative">
      <div
        ref="mapContainer"
        :style="{ height: height }"
        class="w-full rounded-md border border-gray-300"
      ></div>
      
      <!-- Loading overlay -->
      <div
        v-if="!mapLoaded && !mapError"
        class="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md"
      >
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p class="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    </div>
  `,
});
