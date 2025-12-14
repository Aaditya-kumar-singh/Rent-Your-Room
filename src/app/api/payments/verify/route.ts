import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import {
  verifyPaymentSignature,
  getPaymentDetails,
} from "@/services/paymentService";
import Joi from "joi";

// Validation schema
const verifyPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
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
    const { error, value } = verifyPaymentSchema.validate(body);

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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      value;

    // Connect to database
    await connectDB();

    // Find the payment record
    const payment = await Payment.findOne({
      paymentGatewayId: razorpay_order_id,
      userId: session.user.id,
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Payment record not found" },
        },
        { status: 404 }
      );
    }

    // Verify payment signature
    const isSignatureValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isSignatureValid) {
      // Update payment status to failed
      payment.status = "failed";
      await payment.save();

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_SIGNATURE",
            message: "Payment verification failed",
          },
        },
        { status: 400 }
      );
    }

    // Get payment details from Razorpay
    const paymentDetailsResult = await getPaymentDetails(razorpay_payment_id);

    if (!paymentDetailsResult.success || !paymentDetailsResult.payment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PAYMENT_FETCH_FAILED",
            message: "Failed to fetch payment details",
          },
        },
        { status: 500 }
      );
    }

    const paymentDetails = paymentDetailsResult.payment;

    // Update payment record
    payment.status = "completed";
    payment.paymentMethod = paymentDetails.method;
    payment.transactionDate = new Date();
    await payment.save();

    // Find and update the booking
    const booking = await Booking.findById(payment.bookingId);

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "BOOKING_NOT_FOUND", message: "Booking not found" },
        },
        { status: 404 }
      );
    }

    // Update booking payment details and status
    booking.payment.paymentId = razorpay_payment_id;
    booking.payment.status = "completed";
    booking.payment.paymentDate = new Date();
    booking.status = "paid";
    await booking.save();

    // TODO: Send notification to property owner about successful payment
    // This will be implemented in the notification system task

    return NextResponse.json({
      success: true,
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        status: "completed",
        amount: payment.amount,
        bookingId: booking._id,
        message: "Payment verified successfully",
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
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
