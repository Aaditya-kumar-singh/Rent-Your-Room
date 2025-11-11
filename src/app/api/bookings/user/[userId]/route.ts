import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import Booking from "@/models/Booking";
import { Types } from "mongoose";

/**
 * GET /api/bookings/user/[userId] - Get bookings for a specific user (owner's or seeker's bookings)
 * Query params: type=owner|seeker (default: owner)
 * Requirements: 5.1, 5.2
 */
async function getUserBookings(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  try {
    if (!req.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            details: "User must be logged in to view bookings",
          },
        },
        { status: 401 }
      );
    }

    const { userId } = await params;

    // Validate userId format
    if (!Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_USER_ID",
            message: "Invalid user ID format",
            details: "User ID must be a valid MongoDB ObjectId",
          },
        },
        { status: 400 }
      );
    }

    // Check if user is authorized to view these bookings
    // Users can only view their own bookings
    if (req.user.id !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_PERMISSIONS",
            message: "Access denied",
            details: "You can only view your own bookings",
          },
        },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type") || "owner"; // owner or seeker
    const sortBy = url.searchParams.get("sortBy") || "requestDate";
    const sortOrder = (url.searchParams.get("sortOrder") || "desc") as
      | "asc"
      | "desc";

    // Build query based on type
    const query: Record<string, string | Types.ObjectId> = {};

    if (type === "seeker") {
      query.seekerId = new Types.ObjectId(userId);
    } else {
      query.ownerId = new Types.ObjectId(userId);
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    // Get bookings with populated data
    const populatedBookings = await Booking.find(query)
      .populate("roomId", "title monthlyRent location images")
      .populate("seekerId", "name email phone profileImage")
      .populate("ownerId", "name email phone profileImage")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Booking.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        data: {
          bookings: populatedBookings,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
          message: `${
            type === "seeker" ? "Seeker" : "Owner"
          } bookings retrieved successfully`,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Get user bookings error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve bookings",
          details: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getUserBookings);
