import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import { BookingService } from "@/services/bookingService";
import { RoomService } from "@/services/roomService";

/**
 * GET /api/dashboard/owner/stats - Get owner dashboard statistics
 */
async function getOwnerStats(req: AuthenticatedRequest): Promise<NextResponse> {
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

    // Get owner's rooms
    const roomsResult = await RoomService.getRoomsByOwner(userId, {
      page: 1,
      limit: 1000, // Get all rooms for stats
    });

    // Get owner's bookings
    const bookingsResult = await BookingService.getBookingsByOwner(userId, {
      page: 1,
      limit: 1000, // Get all bookings for stats
    });

    const rooms = roomsResult.rooms || [];
    const bookings = bookingsResult.bookings || [];

    // Calculate stats
    const totalRooms = rooms.length;
    const activeBookings = bookings.filter(
      (booking: any) => booking.status === "confirmed"
    ).length;
    const pendingRequests = bookings.filter(
      (booking: any) => booking.status === "pending"
    ).length;

    // Calculate monthly earnings from confirmed bookings
    const monthlyEarnings = bookings
      .filter((booking: any) => booking.status === "confirmed")
      .reduce((total: number, booking: any) => {
        return total + (booking.roomId?.monthlyRent || 0);
      }, 0);

    const stats = {
      totalRooms,
      activeBookings,
      pendingRequests,
      monthlyEarnings,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          stats,
          message: "Owner stats retrieved successfully",
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Get owner stats error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve owner stats",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getOwnerStats);
