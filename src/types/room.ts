export interface Room {
  _id: string;
  title: string;
  description: string;
  monthlyRent: number;
  location: {
    address: string;
    coordinates: {
      type: "Point";
      coordinates: [number, number]; // [longitude, latitude]
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

export interface PaginationInfo {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

export interface SearchResponse {
  success: boolean;
  data: {
    rooms: Room[];
    pagination: PaginationInfo;
    filters: any; // SearchFiltersType
  };
  error?: {
    code: string;
    message: string;
    details: string;
  };
}

// Type alias for backward compatibility
export type RoomData = Room;

// Form data interface for room creation/editing
export interface RoomFormData {
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
}
