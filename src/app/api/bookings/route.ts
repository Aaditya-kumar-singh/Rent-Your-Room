import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import { validateInput } from "@/utils/validation";
import { NotificationService } from "@/services/notificationService";
import Booking, { IBooking } from "@/models/Booking";
import Room from "@/models/Room";
import User from "@/models/User";
import { Types } from "mongoose";
import Joi from "joi";

// Validation schema for booking creation
const bookingCreateSchema = Joi.object({
  roomId: Joi.string().required(),
  message: Joi.string().max(500).optional(),
  payment: Joi.object({
    amount: Joi.number().positive().required(),
  }).required(),
});

/**
 * POST /api/bookings - Create booking request
 * Requirements: 3.1, 3.2
 */
async function createBooking(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    if (!req.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            details: "User must be logged in to create bookings",
          },
        },
        { status: 401 }
      );
    }

    // Check if user is a seeker (only seekers can create bookings)
    if (req.user.userType !== "seeker" && req.user.userType !== "both") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_PERMISSIONS",
            message: "Only room seekers can create booking requests",
            details: "User must have 'seeker' or 'both' user type",
          },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = validateInput<{
      roomId: string;
      message?: string;
      payment: { amount: number };
    }>(bookingCreateSchema, body);

    // Validate room ID format
    if (!Types.ObjectId.isValid(validatedData.roomId)) {
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

    // Check if room exists and is available
    const room = await Room.findById(validatedData.roomId).populate(
      "ownerId",
      "_id"
    );
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

    if (!room.availability) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ROOM_NOT_AVAILABLE",
            message: "Room is not available for booking",
            details: "This room is currently not available",
          },
        },
        { status: 400 }
      );
    }

    // Check if user is trying to book their own room
    if (room.ownerId._id.toString() === req.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CANNOT_BOOK_OWN_ROOM",
            message: "Cannot book your own room",
            details: "Property owners cannot book their own rooms",
          },
        },
        { status: 400 }
      );
    }

    // Check if user already has a pending/active booking for this room
    const existingBooking = await Booking.findOne({
      roomId: validatedData.roomId,
      seekerId: req.user.id,
      status: { $in: ["pending", "verified", "paid", "confirmed"] },
    });

    if (existingBooking) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BOOKING_ALREADY_EXISTS",
            message: "You already have an active booking request for this room",
            details: `Current booking status: ${existingBooking.status}`,
          },
        },
        { status: 400 }
      );
    }



    // Validate payment amount matches room rent
    if (validatedData.payment.amount !== room.monthlyRent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PAYMENT_AMOUNT",
            message: "Payment amount does not match room rent",
            details: `Expected: ₹${room.monthlyRent}, Provided: ₹${validatedData.payment.amount}`,
          },
        },
        { status: 400 }
      );
    }

    // Create booking
    const bookingData: Partial<IBooking> = {
      roomId: new Types.ObjectId(validatedData.roomId),
      seekerId: new Types.ObjectId(req.user.id),
      ownerId: room.ownerId._id,
      status: "pending",
      payment: {
        amount: validatedData.payment.amount,
        status: "pending",
      },
      requestDate: new Date(),
      message: validatedData.message,
    };

    const booking = new Booking(bookingData);
    await booking.save();

    // Populate the booking with room and user details
    const populatedBooking = await Booking.findById(booking._id)
      .populate("roomId", "title monthlyRent location images")
      .populate("seekerId", "name email phone profileImage")
      .populate("ownerId", "name email phone profileImage");

    // Send notification to property owner
    try {
      const seeker = await User.findById(req.user.id).select("name");
      if (seeker) {
        await NotificationService.notifyBookingRequest(
          room.ownerId._id,
          seeker.name,
          room.title,
          booking._id
        );
      }
    } catch (notificationError) {
      console.error("Failed to send booking notification:", notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          booking: populatedBooking,
          message: "Booking request created successfully",
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Create booking error:", error);

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

    // Handle duplicate key errors (unique constraint violations)
    if (errorMessage && errorMessage.includes("duplicate key")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BOOKING_ALREADY_EXISTS",
            message: "You already have a booking request for this room",
            details: "Only one active booking per room per user is allowed",
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
          message: "Failed to create booking request",
          details: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings - Get user's bookings
 */
async function getUserBookings(
  req: AuthenticatedRequest
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

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const status = url.searchParams.get("status");
    const userType = url.searchParams.get("userType") || "seeker"; // 'seeker' or 'owner'

    const skip = (page - 1) * limit;

    // Build query based on user type
    const query: Record<string, string> = {};

    if (userType === "owner") {
      // Get bookings for rooms owned by this user
      query.ownerId = req.user.id;
    } else {
      // Get bookings made by this user
      query.seekerId = req.user.id;
    }

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate("roomId", "title monthlyRent location images availability")
      .populate("seekerId", "name email phone profileImage")
      .populate("ownerId", "name email phone profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        data: {
          bookings,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
          message: "Bookings retrieved successfully",
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Get bookings error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve bookings",
          details: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(createBooking);
export const GET = withAuth(getUserBookings);
