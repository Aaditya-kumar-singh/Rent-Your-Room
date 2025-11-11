import { NextRequest, NextResponse } from "next/server";
import {
  RoomService,
  RoomSearchFilters,
  PaginationOptions,
} from "@/services/roomService";
import { validateInput, roomCreateSchema } from "@/utils/validation";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import {
  parseSearchFilters,
  parsePaginationOptions,
  validateCoordinates,
  validateNumericParam,
} from "@/utils/apiHelpers";
import {
  handleError,
  createSuccessResponse,
  AppError,
  ERROR_CODES,
} from "@/utils/errorHandler";

/**
 * POST /api/rooms - Create a new room listing
 * Requirements: 1.1, 1.3, 1.5
 */
async function createRoom(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    // Validate input data
    const validatedData = validateInput<any>(roomCreateSchema, body);

    // Check if user is authorized to create rooms (owner or both)
    if (
      !req.user ||
      (req.user.userType !== "owner" && req.user.userType !== "both")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_PERMISSIONS",
            message: "Only property owners can create room listings",
            details: "User must have 'owner' or 'both' user type",
          },
        },
        { status: 403 }
      );
    }

    // Check if user has verified phone number
    if (!req.user.phoneVerified) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PHONE_VERIFICATION_REQUIRED",
            message: "Phone verification is required to create room listings",
            details: "Please verify your phone number before creating listings",
          },
        },
        { status: 403 }
      );
    }

    // Create room with owner ID
    const roomData = {
      ...validatedData,
      ownerId: req.user.id,
    };

    const room = await RoomService.createRoom(roomData);

    return NextResponse.json(
      {
        success: true,
        data: {
          room,
          message: "Room listing created successfully",
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Create room error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Handle validation errors
    if (errorMessage && errorMessage.includes("validation")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: errorMessage,
            details: "Please check your input data",
          },
        },
        { status: 400 }
      );
    }

    // Handle database errors
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_ENTRY",
            message: "A room with similar details already exists",
            details: "Please check for duplicate listings",
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create room listing",
          details: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rooms - Search and filter rooms
 * Requirements: 2.1, 2.3
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);

    // Parse search filters
    const filters: RoomSearchFilters = {};

    // Price range filters
    const minRent = searchParams.get("minRent");
    const maxRent = searchParams.get("maxRent");
    if (minRent) filters.minRent = parseInt(minRent);
    if (maxRent) filters.maxRent = parseInt(maxRent);

    // Location filters
    const city = searchParams.get("city");
    const state = searchParams.get("state");
    if (city) filters.city = city;
    if (state) filters.state = state;

    // Room type filter
    const roomType = searchParams.get("roomType");
    if (roomType) filters.roomType = roomType;

    // Amenities filter
    const amenitiesParam = searchParams.get("amenities");
    if (amenitiesParam) {
      filters.amenities = amenitiesParam.split(",").map((a) => a.trim());
    }

    // Availability filter
    const availability = searchParams.get("availability");
    if (availability !== null) {
      filters.availability = availability === "true";
    }

    // Text search
    const searchText = searchParams.get("search");
    if (searchText) filters.searchText = searchText;

    // Sample data inclusion
    const includeSampleData = searchParams.get("includeSampleData");
    if (includeSampleData)
      filters.includeSampleData = includeSampleData === "true";

    // Geospatial search
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius");
    if (lat && lng) {
      filters.coordinates = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius: radius ? parseFloat(radius) : 10,
      };
    }

    // Parse pagination options
    const options: PaginationOptions = {};
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder");

    if (page) options.page = parseInt(page);
    if (limit) options.limit = parseInt(limit);
    if (sortBy) options.sortBy = sortBy;
    if (sortOrder && (sortOrder === "asc" || sortOrder === "desc")) {
      options.sortOrder = sortOrder;
    }

    // Validate numeric parameters
    if (filters.minRent && (isNaN(filters.minRent) || filters.minRent < 0)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PARAMETER",
            message: "minRent must be a valid positive number",
            details: "Price filters must be numeric and non-negative",
          },
        },
        { status: 400 }
      );
    }

    if (filters.maxRent && (isNaN(filters.maxRent) || filters.maxRent < 0)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PARAMETER",
            message: "maxRent must be a valid positive number",
            details: "Price filters must be numeric and non-negative",
          },
        },
        { status: 400 }
      );
    }

    if (filters.coordinates) {
      if (isNaN(filters.coordinates.lat) || isNaN(filters.coordinates.lng)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_COORDINATES",
              message: "Invalid latitude or longitude values",
              details: "Coordinates must be valid numeric values",
            },
          },
          { status: 400 }
        );
      }

      if (filters.coordinates.lat < -90 || filters.coordinates.lat > 90) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_LATITUDE",
              message: "Latitude must be between -90 and 90",
              details: "Latitude value is out of valid range",
            },
          },
          { status: 400 }
        );
      }

      if (filters.coordinates.lng < -180 || filters.coordinates.lng > 180) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_LONGITUDE",
              message: "Longitude must be between -180 and 180",
              details: "Longitude value is out of valid range",
            },
          },
          { status: 400 }
        );
      }
    }

    // Search rooms
    const result = await RoomService.searchRooms(filters, options);

    return NextResponse.json(
      {
        success: true,
        data: {
          rooms: result.rooms,
          pagination: {
            page: result.page,
            totalPages: result.totalPages,
            total: result.total,
            limit: options.limit || 10,
          },
          filters: filters,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Room search error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SEARCH_ERROR",
          message: "Failed to search rooms",
          details: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(createRoom);
