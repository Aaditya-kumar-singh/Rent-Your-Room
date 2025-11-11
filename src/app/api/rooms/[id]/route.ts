import { NextRequest, NextResponse } from "next/server";
import { RoomService } from "@/services/roomService";
import { validateInput } from "@/utils/validation";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import { Types } from "mongoose";
import Joi from "joi";

// Validation schema for room updates (all fields optional)
const roomUpdateSchema = Joi.object({
  title: Joi.string().min(5).max(100).optional(),
  description: Joi.string().min(20).max(1000).optional(),
  monthlyRent: Joi.number().positive().optional(),
  location: Joi.object({
    address: Joi.string().optional(),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90).optional(),
      lng: Joi.number().min(-180).max(180).optional(),
    }).optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    pincode: Joi.string()
      .pattern(/^[1-9][0-9]{5}$/)
      .optional(),
  }).optional(),
  images: Joi.array().items(Joi.string()).min(1).max(10).optional(),
  amenities: Joi.array().items(Joi.string()).optional(),
  roomType: Joi.string()
    .valid(
      "single",
      "double",
      "shared",
      "studio",
      "1bhk",
      "2bhk",
      "3bhk",
      "pg",
      "hostel"
    )
    .optional(),
  availability: Joi.boolean().optional(),
});

/**
 * PUT /api/rooms/[id] - Update room listing
 * Requirements: 1.4
 */
async function updateRoom(
  req: AuthenticatedRequest,
  roomId: string
): Promise<NextResponse> {
  try {
    const body = await req.json();

    // Validate room ID format
    if (!Types.ObjectId.isValid(roomId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ROOM_ID",
            message: "Invalid room ID format",
            details: "Room ID must be a valid MongoDB ObjectId",
          },
        },
        { status: 400 }
      );
    }

    // Validate input data
    const validatedData = validateInput<any>(roomUpdateSchema, body);

    // Check if user is authorized to update rooms (owner or both)
    if (
      !req.user ||
      (req.user.userType !== "owner" && req.user.userType !== "both")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_PERMISSIONS",
            message: "Only property owners can update room listings",
            details: "User must have 'owner' or 'both' user type",
          },
        },
        { status: 403 }
      );
    }

    // Verify room ownership
    const isOwner = await RoomService.verifyOwnership(roomId, req.user.id);
    if (!isOwner) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED_ACCESS",
            message: "You can only update your own room listings",
            details: "Room not found or access denied",
          },
        },
        { status: 403 }
      );
    }

    // Update room
    const updatedRoom = await RoomService.updateById(roomId, validatedData);

    if (!updatedRoom) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ROOM_NOT_FOUND",
            message: "Room not found",
            details: "The specified room does not exist",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          room: updatedRoom,
          message: "Room listing updated successfully",
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Update room error:", error);

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

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update room listing",
          details: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rooms/[id] - Delete room listing
 * Requirements: 1.4
 */
async function deleteRoom(
  req: AuthenticatedRequest,
  roomId: string
): Promise<NextResponse> {
  try {
    // Validate room ID format
    if (!Types.ObjectId.isValid(roomId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ROOM_ID",
            message: "Invalid room ID format",
            details: "Room ID must be a valid MongoDB ObjectId",
          },
        },
        { status: 400 }
      );
    }

    // Check if user is authorized to delete rooms (owner or both)
    if (
      !req.user ||
      (req.user.userType !== "owner" && req.user.userType !== "both")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_PERMISSIONS",
            message: "Only property owners can delete room listings",
            details: "User must have 'owner' or 'both' user type",
          },
        },
        { status: 403 }
      );
    }

    // Verify room ownership
    const isOwner = await RoomService.verifyOwnership(roomId, req.user.id);
    if (!isOwner) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED_ACCESS",
            message: "You can only delete your own room listings",
            details: "Room not found or access denied",
          },
        },
        { status: 403 }
      );
    }

    // Delete room
    const deleted = await RoomService.deleteById(roomId);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ROOM_NOT_FOUND",
            message: "Room not found",
            details: "The specified room does not exist",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Room listing deleted successfully",
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Delete room error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete room listing",
          details: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rooms/[id] - Get specific room details
 * This endpoint is used for room details page
 */
async function getRoom(
  req: NextRequest,
  roomId: string
): Promise<NextResponse> {
  try {
    // Validate room ID format
    if (!Types.ObjectId.isValid(roomId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ROOM_ID",
            message: "Invalid room ID format",
            details: "Room ID must be a valid MongoDB ObjectId",
          },
        },
        { status: 400 }
      );
    }

    const room = await RoomService.findById(roomId);

    if (!room) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ROOM_NOT_FOUND",
            message: "Room not found",
            details: "The specified room does not exist",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          room,
          message: "Room details retrieved successfully",
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Get room error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve room details",
          details: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(
  async (
    req: AuthenticatedRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const { id: roomId } = await context.params;
    return updateRoom(req, roomId);
  }
);

export const DELETE = withAuth(
  async (
    req: AuthenticatedRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const { id: roomId } = await context.params;
    return deleteRoom(req, roomId);
  }
);

export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: roomId } = await context.params;
  return getRoom(req, roomId);
};
