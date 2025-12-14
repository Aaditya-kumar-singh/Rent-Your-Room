import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import { BookingService } from "@/services/bookingService";

/**
 * GET /api/dashboard/seeker/stats - Get seeker dashboard statistics
 */
async function getSeekerStats(
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
          },
        },
        { status: 401 }
      );
    }

    const userId = req.user.id;

    // Get seeker's bookings
    const bookingsResult = await BookingService.getBookingsBySeeker(userId, {
      page: 1,
      limit: 1000, // Get all bookings for stats
    });

    const bookings = bookingsResult.bookings || [];

    // Calculate stats
    const totalBookings = bookings.length;
    const activeBookings = bookings.filter(
      (booking: any) => booking.status === "confirmed"
    ).length;
    const pendingRequests = bookings.filter(
      (booking: any) => booking.status === "pending"
    ).length;
    const completedBookings = bookings.filter(
      (booking: any) => booking.status === "completed"
    ).length;

    const stats = {
      totalBookings,
      activeBookings,
      pendingRequests,
      completedBookings,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          stats,
          message: "Seeker stats retrieved successfully",
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Get seeker stats error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve seeker stats",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getSeekerStats);
