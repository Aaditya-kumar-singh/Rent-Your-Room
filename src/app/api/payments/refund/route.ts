import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Booking from "@/models/Booking";
import { createRefund } from "@/services/paymentService";
import Joi from "joi";

// Validation schema
const refundSchema = Joi.object({
  bookingId: Joi.string().required(),
  amount: Joi.number().positive().optional(),
  reason: Joi.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { error, value } = refundSchema.validate(body);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: error.details[0].message,
          },
        },
        { status: 400 }
      );
    }

    const { bookingId, amount, reason } = value;

    // Connect to database
    await connectDB();

    // Find the booking and verify ownership
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Booking not found" },
        },
        { status: 404 }
      );
    }

    // Verify user is either the seeker or owner (owners can initiate refunds too)
    const userId = session.user.id;
    if (
      booking.seekerId.toString() !== userId &&
      booking.ownerId.toString() !== userId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Access denied" },
        },
        { status: 403 }
      );
    }

    // Check if booking payment is completed
    if (booking.payment.status !== "completed") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_STATUS",
            message: "Cannot refund payment that is not completed",
          },
        },
        { status: 400 }
      );
    }

    // Find the payment record
    const payment = await Payment.findOne({
      bookingId: booking._id,
      status: "completed",
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PAYMENT_NOT_FOUND",
            message: "Payment record not found",
          },
        },
        { status: 404 }
      );
    }

    // Check if already refunded
    if (payment.status === "refunded") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ALREADY_REFUNDED",
            message: "Payment has already been refunded",
          },
        },
        { status: 400 }
      );
    }

    // Validate refund amount
    const refundAmount = amount || payment.amount;
    if (refundAmount > payment.amount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_AMOUNT",
            message: "Refund amount cannot exceed original payment amount",
          },
        },
        { status: 400 }
      );
    }

    // Check if we have a payment ID to refund
    if (!booking.payment.paymentId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_PAYMENT_ID",
            message: "Payment ID not found for refund",
          },
        },
        { status: 400 }
      );
    }

    // Create refund with payment gateway
    const refundResult = await createRefund(
      booking.payment.paymentId,
      refundAmount
    );

    if (!refundResult.success || !refundResult.refund) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "REFUND_FAILED",
            message: "Failed to process refund with payment gateway",
          },
        },
        { status: 500 }
      );
    }

    // Update payment record
    payment.status = "refunded";
    payment.refundAmount = refundAmount;
    payment.refundDate = new Date();
    await payment.save();

    // Update booking payment status
    booking.payment.status = "refunded";
    booking.payment.refundDate = new Date();
    booking.status = "cancelled";
    await booking.save();

    // TODO: Send notification to both parties about the refund
    // This will be implemented in the notification system task

    return NextResponse.json({
      success: true,
      data: {
        refundId: refundResult.refund.id,
        refundAmount,
        refundDate: new Date(),
        bookingId: booking._id,
        message: "Refund processed successfully",
      },
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}
