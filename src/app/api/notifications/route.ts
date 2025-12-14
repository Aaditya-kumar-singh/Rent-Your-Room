import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import Notification from "@/models/Notification";
import { Types } from "mongoose";

/**
 * GET /api/notifications - Get user's notifications
 * Requirements: 5.1, 5.5
 */
async function getUserNotifications(
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
            details: "User must be logged in to view notifications",
          },
        },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";

    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, unknown> = {
      userId: new Types.ObjectId(req.user.id),
    };

    if (unreadOnly) {
      query.read = false;
    }

    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      userId: new Types.ObjectId(req.user.id),
      read: false,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          notifications,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
          unreadCount,
          message: "Notifications retrieved successfully",
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Get notifications error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve notifications",
          details: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications - Create a new notification (internal use)
 */
async function createNotification(
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
            details: "User must be logged in to create notifications",
          },
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId, type, title, message, data } = body;

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Missing required fields",
            details: "userId, type, title, and message are required",
          },
        },
        { status: 400 }
      );
    }

    // Validate user ID format
    if (!Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_USER_ID",
            message: "Invalid user ID format",
            details: "User ID must be a valid MongoDB ObjectId",
          },
        },
        { status: 400 }
      );
    }

    // Create notification
    const notification = new Notification({
      userId: new Types.ObjectId(userId),
      type,
      title,
      message,
      data: data || {},
    });

    await notification.save();

    return NextResponse.json(
      {
        success: true,
        data: {
          notification,
          message: "Notification created successfully",
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Create notification error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create notification",
          details: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getUserNotifications);
export const POST = withAuth(createNotification);
