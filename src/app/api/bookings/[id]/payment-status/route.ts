import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user session
    const session: Session | null = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    const { id: bookingId } = await params;

    // Connect to database
    await connectDB();

    // Find the booking and verify access
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

    // Verify user has access to this booking (either seeker or owner)
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

    // Return payment status information
    return NextResponse.json({
      success: true,
      data: {
        paymentId: booking.payment.paymentId,
        orderId: booking.payment.orderId,
        amount: booking.payment.amount,
        status: booking.payment.status,
        paymentDate: booking.payment.paymentDate,
        refundDate: booking.payment.refundDate,
      },
    });
  } catch (error) {
    console.error("Error fetching payment status:", error);
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
