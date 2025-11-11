import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import { validateInput } from "@/utils/validation";
import { BookingService } from "@/services/bookingService";
import { NotificationService } from "@/services/notificationService";
import Room from "@/models/Room";
import User from "@/models/User";
import { Types } from "mongoose";
import Joi from "joi";

// Validation schema for status update
const statusUpdateSchema = Joi.object({
  status: Joi.string().valid("confirmed", "cancelled").required().messages({
    "any.only": "Status must be either 'confirmed' or 'cancelled'",
  }),
  message: Joi.string().max(500).optional(),
});

/**
 * PUT /api/bookings/[id]/status - Update booking status (approve/reject)
 * Requirements: 5.2, 5.4, 5.5
 */
async function updateBookingStatus(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    if (!req.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            details: "User must be logged in to update booking status",
          },
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate booking ID format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_BOOKING_ID",
            message: "Invalid booking ID format",
            details: "Booking ID must be a valid MongoDB ObjectId",
          },
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = validateInput<{
      status: "confirmed" | "cancelled";
      message?: string;
    }>(statusUpdateSchema, body);

    // Check if booking exists and get current details
    const booking = await BookingService.findById(id);
    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BOOKING_NOT_FOUND",
            message: "Booking not found",
            details: "The specified booking does not exist",
          },
        },
        { status: 404 }
      );
    }

    // Verify that the user is the owner of the room
    if (booking.ownerId.toString() !== req.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_PERMISSIONS",
            message: "Access denied",
            details: "Only the room owner can update booking status",
          },
        },
        { status: 403 }
      );
    }

    // Check if booking is in a valid state for status update
    const validStatuses = ["pending", "verified", "paid"];
    if (!validStatuses.includes(booking.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_BOOKING_STATE",
            message: "Cannot update booking status",
            details: `Booking status '${
              booking.status
            }' cannot be changed. Valid states: ${validStatuses.join(", ")}`,
          },
        },
        { status: 400 }
      );
    }

    // Special validation for confirming bookings
    if (validatedData.status === "confirmed") {
      // Only allow confirmation if payment is completed
      if (booking.payment.status !== "completed") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "PAYMENT_NOT_COMPLETED",
              message: "Cannot confirm booking without completed payment",
              details: `Payment status is '${booking.payment.status}'. Payment must be completed first.`,
            },
          },
          { status: 400 }
        );
      }

      // Only allow confirmation if Aadhaar is verified
      if (!booking.aadhaarDocument.verified) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "AADHAAR_NOT_VERIFIED",
              message: "Cannot confirm booking without Aadhaar verification",
              details:
                "Aadhaar document must be verified before confirming booking",
            },
          },
          { status: 400 }
        );
      }
    }

    // Update booking status
    const updatedBooking = await BookingService.updateStatus(
      id,
      validatedData.status,
      validatedData.message
    );

    if (!updatedBooking) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UPDATE_FAILED",
            message: "Failed to update booking status",
            details: "An error occurred while updating the booking",
          },
        },
        { status: 500 }
      );
    }

    // Send notifications to seeker
    try {
      // Get room and user details for notification
      const room = await Room.findById(booking.roomId).select("title");
      const owner = await User.findById(booking.ownerId).select("name");

      if (room && owner) {
        if (validatedData.status === "confirmed") {
          await NotificationService.notifyBookingConfirmed(
            booking.seekerId.toString(),
            owner.name || "Property Owner",
            room.title,
            id
          );
        } else if (validatedData.status === "cancelled") {
          await NotificationService.notifyBookingCancelled(
            booking.seekerId.toString(),
            owner.name || "Property Owner",
            room.title,
            id,
            validatedData.message
          );
        }
      }
    } catch (notificationError) {
      console.error("Failed to send notification:", notificationError);
      // Don't fail the request if notification fails
    }

    const statusMessage =
      validatedData.status === "confirmed"
        ? "Booking confirmed successfully"
        : "Booking cancelled successfully";

    return NextResponse.json(
      {
        success: true,
        data: {
          booking: updatedBooking,
          message: statusMessage,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Update booking status error:", error);

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
          message: "Failed to update booking status",
          details: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(updateBookingStatus);
