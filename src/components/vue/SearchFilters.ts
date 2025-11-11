import { defineComponent, reactive, ref, watch } from "vue";

// Define interfaces for search filters
export interface SearchFilters {
  minRent?: number;
  maxRent?: number;
  city?: string;
  state?: string;
  roomType?: string;
  amenities?: string[];
  searchText?: string;
  coordinates?: {
    lat: number;
    lng: number;
    radius?: number;
  };
}

export default defineComponent({
  name: "SearchFilters",
  props: {
    initialFilters: {
      type: Object as () => SearchFilters,
      default: () => ({}),
    },
    onFiltersChange: {
      type: Function as unknown as () => (filters: SearchFilters) => void,
      required: true,
    },
  },
  setup(props) {
    // Reactive filters data
    const filters = reactive<SearchFilters>({
      minRent: props.initialFilters?.minRent || undefined,
      maxRent: props.initialFilters?.maxRent || undefined,
      city: props.initialFilters?.city || "",
      state: props.initialFilters?.state || "",
      roomType: props.initialFilters?.roomType || "",
      amenities: props.initialFilters?.amenities || [],
      searchText: props.initialFilters?.searchText || "",
      coordinates: props.initialFilters?.coordinates || undefined,
    });

    const showAdvancedFilters = ref(false);
    const isApplyingFilters = ref(false);

    // Available amenities
    const availableAmenities = [
      "WiFi",
      "AC",
      "Parking",
      "Laundry",
      "Kitchen",
      "Balcony",
      "Furnished",
      "Security",
      "Elevator",
      "Power Backup",
      "Water Supply",
      "Gym",
      "Swimming Pool",
      "Garden",
    ];

    // Room types
    const roomTypes = [
      { value: "single", label: "Single Room" },
      { value: "double", label: "Double Room" },
      { value: "shared", label: "Shared Room" },
      { value: "studio", label: "Studio Apartment" },
      { value: "1bhk", label: "1 BHK" },
      { value: "2bhk", label: "2 BHK" },
      { value: "3bhk", label: "3 BHK" },
      { value: "pg", label: "PG Accommodation" },
      { value: "hostel", label: "Hostel" },
    ];

    // Popular cities in India
    const popularCities = [
      "Mumbai",
      "Delhi",
      "Bangalore",
      "Chennai",
      "Kolkata",
      "Hyderabad",
      "Pune",
      "Ahmedabad",
      "Jaipur",
      "Surat",
    ];

    // Apply filters
    const applyFilters = () => {
      isApplyingFilters.value = true;

      // Clean up filters - remove empty values
      const cleanFilters: SearchFilters = {};

      if (filters.searchText?.trim()) {
        cleanFilters.searchText = filters.searchText.trim();
      }

      if (filters.minRent && filters.minRent > 0) {
        cleanFilters.minRent = filters.minRent;
      }

      if (filters.maxRent && filters.maxRent > 0) {
        cleanFilters.maxRent = filters.maxRent;
      }

      if (filters.city?.trim()) {
        cleanFilters.city = filters.city.trim();
      }

      if (filters.state?.trim()) {
        cleanFilters.state = filters.state.trim();
      }

      if (filters.roomType) {
        cleanFilters.roomType = filters.roomType;
      }

      if (filters.amenities && filters.amenities.length > 0) {
        cleanFilters.amenities = filters.amenities;
      }

      if (filters.coordinates) {
        cleanFilters.coordinates = filters.coordinates;
      }

      props.onFiltersChange(cleanFilters);

      setTimeout(() => {
        isApplyingFilters.value = false;
      }, 500);
    };

    // Clear all filters
    const clearFilters = () => {
      filters.minRent = undefined;
      filters.maxRent = undefined;
      filters.city = "";
      filters.state = "";
      filters.roomType = "";
      filters.amenities = [];
      filters.searchText = "";
      filters.coordinates = undefined;

      applyFilters();
    };

    // Toggle advanced filters
    const toggleAdvancedFilters = () => {
      showAdvancedFilters.value = !showAdvancedFilters.value;
    };

    // Handle price range validation
    const validatePriceRange = () => {
      if (
        filters.minRent &&
        filters.maxRent &&
        filters.minRent > filters.maxRent
      ) {
        // Swap values if min is greater than max
        const temp = filters.minRent;
        filters.minRent = filters.maxRent;
        filters.maxRent = temp;
      }
    };

    // Watch for changes and auto-apply basic filters
    watch(
      () => filters.searchText,
      () => {
        // Auto-apply search text changes after a delay
        setTimeout(() => {
          if (filters.searchText !== props.initialFilters?.searchText) {
            applyFilters();
          }
        }, 500);
      }
    );

    return {
      filters,
      showAdvancedFilters,
      isApplyingFilters,
      availableAmenities,
      roomTypes,
      popularCities,
      applyFilters,
      clearFilters,
      toggleAdvancedFilters,
      validatePriceRange,
    };
  },
  template: `
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="space-y-4">
        <!-- Search Text -->
        <div>
          <label for="searchText" class="block text-sm font-medium text-gray-700 mb-2">
            Search Rooms
          </label>
          <div class="relative">
            <input
              id="searchText"
              v-model="filters.searchText"
              type="text"
              placeholder="Search by title, description, or location..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <!-- Quick Filters Row -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- City -->
          <div>
            <label for="city" class="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <select
              id="city"
              v-model="filters.city"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Any City</option>
              <option v-for="city in popularCities" :key="city" :value="city">
                {{ city }}
              </option>
            </select>
          </div>

          <!-- Room Type -->
          <div>
            <label for="roomType" class="block text-sm font-medium text-gray-700 mb-1">
              Room Type
            </label>
            <select
              id="roomType"
              v-model="filters.roomType"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Any Type</option>
              <option v-for="type in roomTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>

          <!-- Price Range -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Min Rent (₹)
            </label>
            <input
              v-model.number="filters.minRent"
              type="number"
              min="0"
              step="1000"
              placeholder="Min"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @blur="validatePriceRange"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Max Rent (₹)
            </label>
            <input
              v-model.number="filters.maxRent"
              type="number"
              min="0"
              step="1000"
              placeholder="Max"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @blur="validatePriceRange"
            />
          </div>
        </div>

        <!-- Advanced Filters Toggle -->
        <div class="flex items-center justify-between">
          <button
            type="button"
            @click="toggleAdvancedFilters"
            class="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <span>{{ showAdvancedFilters ? 'Hide' : 'Show' }} Advanced Filters</span>
            <svg
              class="ml-1 h-4 w-4 transform transition-transform"
              :class="{ 'rotate-180': showAdvancedFilters }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        </div>

        <!-- Advanced Filters -->
        <div v-if="showAdvancedFilters" class="border-t pt-4 space-y-4">
          <!-- State -->
          <div>
            <label for="state" class="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <input
              id="state"
              v-model="filters.state"
              type="text"
              placeholder="Enter state name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- Amenities -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Amenities
            </label>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <label
                v-for="amenity in availableAmenities"
                :key="amenity"
                class="flex items-center"
              >
                <input
                  type="checkbox"
                  :value="amenity"
                  v-model="filters.amenities"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700">{{ amenity }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <button
            type="button"
            @click="applyFilters"
            :disabled="isApplyingFilters"
            class="flex-1 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isApplyingFilters">Searching...</span>
            <span v-else>Search Rooms</span>
          </button>
          
          <button
            type="button"
            @click="clearFilters"
            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  `,
});
