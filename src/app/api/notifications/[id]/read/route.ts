import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import Notification from "@/models/Notification";
import { Types } from "mongoose";

/**
 * PUT /api/notifications/[id]/read - Mark notification as read
 * Requirements: 5.1, 5.5
 */
async function markNotificationAsRead(
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
            details: "User must be logged in to update notifications",
          },
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate notification ID format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_NOTIFICATION_ID",
            message: "Invalid notification ID format",
            details: "Notification ID must be a valid MongoDB ObjectId",
          },
        },
        { status: 400 }
      );
    }

    // Find and update notification
    const notification = await Notification.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(req.user.id),
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOTIFICATION_NOT_FOUND",
            message: "Notification not found",
            details:
              "The specified notification does not exist or you don't have permission to access it",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          notification,
          message: "Notification marked as read",
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Mark notification as read error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update notification",
          details: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(markNotificationAsRead);
