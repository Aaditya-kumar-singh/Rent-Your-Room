import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import Notification from "@/models/Notification";
import { Types } from "mongoose";

/**
 * PUT /api/notifications/mark-all-read - Mark all notifications as read
 * Requirements: 5.1, 5.5
 */
async function markAllNotificationsAsRead(
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
            details: "User must be logged in to update notifications",
          },
        },
        { status: 401 }
      );
    }

    // Update all unread notifications for the user
    const result = await Notification.updateMany(
      {
        userId: new Types.ObjectId(req.user.id),
        read: false,
      },
      { read: true }
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          updatedCount: result.modifiedCount,
          message: `${result.modifiedCount} notifications marked as read`,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Mark all notifications as read error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update notifications",
          details: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(markAllNotificationsAsRead);
