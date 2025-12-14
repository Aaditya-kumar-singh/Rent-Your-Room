import { NextResponse } from "next/server";
import { RoomService } from "@/services/roomService";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import { Types } from "mongoose";

/**
 * GET /api/rooms/owner/[userId] - Get rooms by owner ID
 * Requirements: 1.1, 1.3, 1.5
 */
async function getOwnerRooms(
  req: AuthenticatedRequest,
  userId: string
): Promise<NextResponse> {
  try {
    const url = new URL(req.url);

    // Parse query parameters for pagination
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = (url.searchParams.get("sortOrder") || "desc") as
      | "asc"
      | "desc";

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

    // Check authorization - users can only view their own rooms unless they're admin
    if (req.user?.id !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED_ACCESS",
            message: "You can only view your own room listings",
            details: "Access denied to other users' room data",
          },
        },
        { status: 403 }
      );
    }

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PAGINATION",
            message: "Invalid pagination parameters",
            details: "Page must be >= 1, limit must be between 1 and 100",
          },
        },
        { status: 400 }
      );
    }

    const paginationOptions = {
      page,
      limit,
      sortBy,
      sortOrder,
    };

    const result = await RoomService.getRoomsByOwner(userId, paginationOptions);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...result,
          message: `Found ${result.total} room(s) for owner`,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Get owner rooms error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Handle specific service errors
    if (errorMessage === "Invalid owner ID format") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_OWNER_ID",
            message: errorMessage,
            details: "Please provide a valid owner ID",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve owner rooms",
          details: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(
  async (
    req: AuthenticatedRequest,
    context: { params: Promise<{ userId: string }> }
  ) => {
    const { userId } = await context.params;
    return getOwnerRooms(req, userId);
  }
);
