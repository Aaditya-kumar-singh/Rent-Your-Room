import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import {
  createPaymentOrder,
  generateReceiptId,
  convertToPaise,
} from "@/services/paymentService";
import Joi from "joi";

// Validation schema
const createOrderSchema = Joi.object({
  bookingId: Joi.string().required(),
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
    const { error, value } = createOrderSchema.validate(body);

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

    const { bookingId } = value;

    // Connect to database
    await connectDB();

    // Find the booking and verify ownership
    const booking = await Booking.findById(bookingId)
      .populate("roomId", "title monthlyRent")
      .populate("seekerId", "name email");

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Booking not found" },
        },
        { status: 404 }
      );
    }

    // Verify user is the seeker for this booking
    if (booking.seekerId._id.toString() !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Access denied" },
        },
        { status: 403 }
      );
    }



    // Check if payment order already exists
    const existingPayment = await Payment.findOne({
      bookingId: booking._id,
      status: { $in: ["created", "pending"] },
    });

    if (existingPayment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ORDER_EXISTS",
            message: "Payment order already exists for this booking",
          },
        },
        { status: 400 }
      );
    }

    // Get payment amount from booking
    const amountInRupees = booking.payment.amount;
    const amountInPaise = convertToPaise(amountInRupees);

    // Generate receipt ID
    const receiptId = generateReceiptId(bookingId);

    // Create payment order with Razorpay
    const orderResult = await createPaymentOrder({
      amount: amountInPaise,
      currency: "INR",
      receipt: receiptId,
      notes: {
        bookingId: bookingId,
        userId: session.user.id,
        roomTitle: booking.roomId.title,
      },
    });

    if (!orderResult.success || !orderResult.order) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PAYMENT_ORDER_FAILED",
            message: "Failed to create payment order",
          },
        },
        { status: 500 }
      );
    }

    // Save payment record to database
    const payment = new Payment({
      bookingId: booking._id,
      userId: session.user.id,
      paymentGatewayId: orderResult.order.id,
      orderId: orderResult.order.id,
      amount: amountInPaise,
      currency: "INR",
      status: "created",
    });

    await payment.save();

    // Update booking with payment order details
    booking.payment.orderId = orderResult.order.id;
    booking.payment.status = "pending";
    await booking.save();

    // Return order details for frontend
    return NextResponse.json({
      success: true,
      data: {
        orderId: orderResult.order.id,
        amount: amountInPaise,
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID,
        name: "Room Rental Platform",
        description: `Payment for ${booking.roomId.title}`,
        prefill: {
          name: booking.seekerId.name,
          email: booking.seekerId.email,
        },
        theme: {
          color: "#3B82F6",
        },
      },
    });
  } catch (error) {
    console.error("Error creating payment order:", error);
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
