import { defineComponent, computed } from "vue";

// Define interfaces
interface Room {
  _id: string;
  title: string;
  description: string;
  monthlyRent: number;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    city: string;
    state: string;
    pincode: string;
  };
  images: string[];
  amenities: string[];
  roomType: string;
  availability: boolean;
  ownerId: {
    name: string;
    email: string;
    phone: string;
    profileImage?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

export default defineComponent({
  name: "SearchResults",
  props: {
    rooms: {
      type: Array as () => Room[],
      required: true,
    },
    pagination: {
      type: Object as () => PaginationInfo,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    onRoomClick: {
      type: Function as unknown as () => (room: Room) => void,
      required: true,
    },
    onPageChange: {
      type: Function as unknown as () => (page: number) => void,
      required: true,
    },
  },
  setup(props) {
    // Computed properties
    const hasResults = computed(() => props.rooms.length > 0);
    const showPagination = computed(() => props.pagination.totalPages > 1);

    // Format currency
    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(amount);
    };

    // Format room type
    const formatRoomType = (type: string): string => {
      const typeMap: Record<string, string> = {
        single: "Single Room",
        double: "Double Room",
        shared: "Shared Room",
        studio: "Studio Apartment",
        "1bhk": "1 BHK",
        "2bhk": "2 BHK",
        "3bhk": "3 BHK",
        pg: "PG Accommodation",
        hostel: "Hostel",
      };
      return typeMap[type] || type;
    };

    // Truncate text
    const truncateText = (text: string, maxLength: number): string => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + "...";
    };

    // Handle room click
    const handleRoomClick = (room: Room) => {
      props.onRoomClick(room);
    };

    // Handle page change
    const handlePageChange = (page: number) => {
      if (page >= 1 && page <= props.pagination.totalPages) {
        props.onPageChange(page);
      }
    };

    // Generate page numbers for pagination
    const getPageNumbers = computed(() => {
      const current = props.pagination.page;
      const total = props.pagination.totalPages;
      const pages: (number | string)[] = [];

      if (total <= 7) {
        // Show all pages if total is 7 or less
        for (let i = 1; i <= total; i++) {
          pages.push(i);
        }
      } else {
        // Show first page
        pages.push(1);

        if (current > 4) {
          pages.push("...");
        }

        // Show pages around current page
        const start = Math.max(2, current - 1);
        const end = Math.min(total - 1, current + 1);

        for (let i = start; i <= end; i++) {
          pages.push(i);
        }

        if (current < total - 3) {
          pages.push("...");
        }

        // Show last page
        if (total > 1) {
          pages.push(total);
        }
      }

      return pages;
    });

    return {
      hasResults,
      showPagination,
      formatCurrency,
      formatRoomType,
      truncateText,
      handleRoomClick,
      handlePageChange,
      getPageNumbers,
    };
  },
  template: `
    <div class="space-y-6">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div class="flex space-x-4">
            <div class="bg-gray-300 rounded-lg w-48 h-32"></div>
            <div class="flex-1 space-y-3">
              <div class="bg-gray-300 h-6 rounded w-3/4"></div>
              <div class="bg-gray-300 h-4 rounded w-1/2"></div>
              <div class="bg-gray-300 h-4 rounded w-full"></div>
              <div class="bg-gray-300 h-4 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div v-else-if="!hasResults" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-900">No rooms found</h3>
        <p class="mt-2 text-gray-500">Try adjusting your search filters to find more results.</p>
      </div>

      <!-- Results -->
      <div v-else class="space-y-4">
        <!-- Results Header -->
        <div class="flex justify-between items-center">
          <p class="text-sm text-gray-600">
            Showing {{ ((pagination.page - 1) * pagination.limit) + 1 }} - 
            {{ Math.min(pagination.page * pagination.limit, pagination.total) }} 
            of {{ pagination.total }} rooms
          </p>
        </div>

        <!-- Room Cards -->
        <div class="space-y-4">
          <div
            v-for="room in rooms"
            :key="room._id"
            @click="handleRoomClick(room)"
            class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
          >
            <div class="flex flex-col md:flex-row">
              <!-- Room Image -->
              <div class="md:w-64 h-48 md:h-auto relative">
                <img
                  :src="room.images[0] || '/placeholder-room.jpg'"
                  :alt="room.title"
                  class="w-full h-full object-cover"
                />
                <div class="absolute top-2 left-2">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="room.availability ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                  >
                    {{ room.availability ? 'Available' : 'Not Available' }}
                  </span>
                </div>
                <div v-if="room.images.length > 1" class="absolute bottom-2 right-2">
                  <span class="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    +{{ room.images.length - 1 }} more
                  </span>
                </div>
              </div>

              <!-- Room Details -->
              <div class="flex-1 p-6">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="text-lg font-semibold text-gray-900 hover:text-blue-600">
                    {{ room.title }}
                  </h3>
                  <div class="text-right">
                    <p class="text-2xl font-bold text-blue-600">
                      {{ formatCurrency(room.monthlyRent) }}
                    </p>
                    <p class="text-sm text-gray-500">per month</p>
                  </div>
                </div>

                <div class="flex items-center text-sm text-gray-600 mb-2">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <span>{{ room.location.city }}, {{ room.location.state }}</span>
                  <span class="mx-2">•</span>
                  <span class="bg-gray-100 px-2 py-1 rounded text-xs">
                    {{ formatRoomType(room.roomType) }}
                  </span>
                </div>

                <p class="text-gray-600 text-sm mb-3">
                  {{ truncateText(room.description, 150) }}
                </p>

                <!-- Amenities -->
                <div v-if="room.amenities.length > 0" class="mb-3">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="amenity in room.amenities.slice(0, 4)"
                      :key="amenity"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {{ amenity }}
                    </span>
                    <span
                      v-if="room.amenities.length > 4"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                    >
                      +{{ room.amenities.length - 4 }} more
                    </span>
                  </div>
                </div>

                <!-- Owner Info -->
                <div class="flex items-center justify-between text-sm text-gray-500">
                  <div class="flex items-center">
                    <div class="w-6 h-6 bg-gray-300 rounded-full mr-2 flex items-center justify-center">
                      <span class="text-xs font-medium">
                        {{ room.ownerId.name.charAt(0).toUpperCase() }}
                      </span>
                    </div>
                    <span>Listed by {{ room.ownerId.name }}</span>
                  </div>
                  <span>{{ new Date(room.createdAt).toLocaleDateString() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="showPagination" class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div class="flex flex-1 justify-between sm:hidden">
            <button
              @click="handlePageChange(pagination.page - 1)"
              :disabled="pagination.page <= 1"
              class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              @click="handlePageChange(pagination.page + 1)"
              :disabled="pagination.page >= pagination.totalPages"
              class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing
                <span class="font-medium">{{ ((pagination.page - 1) * pagination.limit) + 1 }}</span>
                to
                <span class="font-medium">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
                of
                <span class="font-medium">{{ pagination.total }}</span>
                results
              </p>
            </div>
            <div>
              <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  @click="handlePageChange(pagination.page - 1)"
                  :disabled="pagination.page <= 1"
                  class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="sr-only">Previous</span>
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
                  </svg>
                </button>
                
                <template v-for="(pageNum, index) in getPageNumbers" :key="index">
                  <span
                    v-if="pageNum === '...'"
                    class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
                  >
                    ...
                  </span>
                  <button
                    v-else
                    @click="handlePageChange(pageNum as number)"
                    :class="[
                      'relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0',
                      pageNum === pagination.page
                        ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                        : 'text-gray-900'
                    ]"
                  >
                    {{ pageNum }}
                  </button>
                </template>
                
                <button
                  @click="handlePageChange(pagination.page + 1)"
                  :disabled="pagination.page >= pagination.totalPages"
                  class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="sr-only">Next</span>
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
});
