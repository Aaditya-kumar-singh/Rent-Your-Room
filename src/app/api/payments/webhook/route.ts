import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import { NotificationService } from "@/services/notificationService";
import User from "@/models/User";
import Room from "@/models/Room";

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { success: false, error: "Missing signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Parse the webhook payload
    const event = JSON.parse(body);

    // Connect to database
    await connectDB();

    // Handle different webhook events
    switch (event.event) {
      case "payment.captured":
        await handlePaymentCaptured(event.payload.payment.entity);
        break;

      case "payment.failed":
        await handlePaymentFailed(event.payload.payment.entity);
        break;

      case "order.paid":
        await handleOrderPaid(event.payload.order.entity);
        break;

      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

interface RazorpayPaymentData {
  id: string;
  order_id: string;
  method: string;
  captured_at: number;
  error_code?: string;
  error_description?: string;
}

interface RazorpayOrderData {
  id: string;
  amount_paid: number;
}

async function handlePaymentCaptured(paymentData: RazorpayPaymentData) {
  try {
    const {
      id: paymentId,
      order_id: orderId,
      method,
      captured_at,
    } = paymentData;

    // Find payment record
    const payment = await Payment.findOne({ paymentGatewayId: orderId });

    if (!payment) {
      console.error(`Payment record not found for order: ${orderId}`);
      return;
    }

    // Update payment status
    payment.status = "completed";
    payment.paymentMethod = method;
    payment.transactionDate = new Date(captured_at * 1000);
    await payment.save();

    // Update booking
    const booking = await Booking.findById(payment.bookingId);

    if (booking) {
      booking.payment.paymentId = paymentId;
      booking.payment.status = "completed";
      booking.payment.paymentDate = new Date(captured_at * 1000);
      booking.status = "paid";
      await booking.save();

      console.log(`Payment captured for booking: ${booking._id}`);

      // Send payment confirmation notification to property owner
      try {
        const room = await Room.findById(booking.roomId).select("title");
        const seeker = await User.findById(booking.seekerId).select("name");

        if (room && seeker) {
          await NotificationService.notifyPaymentCompleted(
            booking.ownerId.toString(),
            seeker.name,
            room.title,
            payment.amount,
            booking._id.toString()
          );
        }
      } catch (notificationError) {
        console.error(
          "Failed to send payment confirmation notification:",
          notificationError
        );
        // Don't fail the webhook if notification fails
      }
    }
  } catch (error) {
    console.error("Error handling payment captured:", error);
  }
}

async function handlePaymentFailed(paymentData: RazorpayPaymentData) {
  try {
    const { order_id: orderId, error_code, error_description } = paymentData;

    // Find payment record
    const payment = await Payment.findOne({ paymentGatewayId: orderId });

    if (!payment) {
      console.error(`Payment record not found for order: ${orderId}`);
      return;
    }

    // Update payment status
    payment.status = "failed";
    await payment.save();

    // Update booking
    const booking = await Booking.findById(payment.bookingId);

    if (booking) {
      booking.payment.status = "failed";
      await booking.save();

      console.log(
        `Payment failed for booking: ${booking._id}, Error: ${error_description}`
      );
    }
  } catch (error) {
    console.error("Error handling payment failed:", error);
  }
}

async function handleOrderPaid(orderData: RazorpayOrderData) {
  try {
    const { id: orderId, amount_paid } = orderData;

    // Find payment record
    const payment = await Payment.findOne({ paymentGatewayId: orderId });

    if (!payment) {
      console.error(`Payment record not found for order: ${orderId}`);
      return;
    }

    // Verify amount
    if (payment.amount !== amount_paid) {
      console.error(`Amount mismatch for order: ${orderId}`);
      return;
    }

    console.log(`Order paid webhook processed for order: ${orderId}`);
  } catch (error) {
    console.error("Error handling order paid:", error);
  }
}
