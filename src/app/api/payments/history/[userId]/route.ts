import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Booking from "@/models/Booking";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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

    const { userId: requestedUserId } = await params;

    // Verify user can only access their own payment history
    if (session.user.id !== requestedUserId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Access denied" },
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    // Connect to database
    await connectDB();

    // Build query
    const query: Record<string, any> = { userId: requestedUserId };
    if (status) {
      query.status = status;
    }

    // Get total count for pagination
    const totalCount = await Payment.countDocuments(query);

    // Fetch payments with pagination
    const payments = await Payment.find(query)
      .populate({
        path: "bookingId",
        populate: {
          path: "roomId",
          select: "title location.address",
        },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Format payment data
    const formattedPayments = payments.map((payment) => ({
      id: payment._id,
      bookingId: payment.bookingId._id,
      roomTitle: payment.bookingId.roomId?.title || "Unknown Room",
      roomAddress:
        payment.bookingId.roomId?.location?.address || "Unknown Address",
      paymentGatewayId: payment.paymentGatewayId,
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      transactionDate: payment.transactionDate,
      refundAmount: payment.refundAmount,
      refundDate: payment.refundDate,
      createdAt: payment.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        payments: formattedPayments,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
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
