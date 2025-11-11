import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import {
  generateDocumentAccessToken,
  verifyDocumentAccessToken,
} from "@/lib/documentStorage";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";

interface RouteParams {
  params: Promise<{ documentId: string }>;
}

/**
 * GET /api/documents/[documentId] - Secure document access with authorization
 * Requirements: 3.1, 3.2 - Secure Aadhaar document access
 */
async function getDocument(
  req: AuthenticatedRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    if (!req.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            details: "User must be logged in to access documents",
          },
        },
        { status: 401 }
      );
    }

    const { documentId } = await params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const bookingId = searchParams.get("bookingId");

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_TOKEN",
            message: "Access token required",
            details: "Document access requires a valid token",
          },
        },
        { status: 400 }
      );
    }

    // Verify access token
    if (!verifyDocumentAccessToken(token, req.user.id, documentId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid or expired access token",
            details: "Please request a new access token",
          },
        },
        { status: 403 }
      );
    }

    // Additional authorization check for booking-related documents
    if (bookingId) {
      await connectDB();
      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "BOOKING_NOT_FOUND",
              message: "Booking not found",
              details: "The specified booking does not exist",
            },
          },
          { status: 404 }
        );
      }

      // Check if user has permission to view this document
      const canAccess =
        booking.seekerId.toString() === req.user.id || // Document owner
        booking.ownerId.toString() === req.user.id; // Property owner

      if (!canAccess) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "ACCESS_DENIED",
              message: "Access denied",
              details: "You don't have permission to view this document",
            },
          },
          { status: 403 }
        );
      }
    }

    // Generate secure access URL (this would typically redirect to the actual file)
    // For security, we don't directly serve the file but provide a time-limited access URL
    const accessUrl = `/api/documents/serve/${documentId}?token=${token}`;

    return NextResponse.json({
      success: true,
      data: {
        documentId,
        accessUrl,
        expiresIn: 3600, // 1 hour
        message: "Document access granted",
      },
    });
  } catch (error) {
    console.error("Document access error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ACCESS_ERROR",
          message: "Failed to access document",
          details: "An error occurred while processing document access",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents/[documentId] - Generate document access token
 * Requirements: 3.1, 3.2 - Secure document access token generation
 */
async function generateAccessToken(
  req: AuthenticatedRequest,
  { params }: RouteParams
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

    const { documentId } = await params;
    const body = await req.json();
    const { bookingId, purpose } = body;

    // Verify user has permission to generate token for this document
    if (bookingId) {
      await connectDB();
      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "BOOKING_NOT_FOUND",
              message: "Booking not found",
            },
          },
          { status: 404 }
        );
      }

      const canAccess =
        booking.seekerId.toString() === req.user.id ||
        booking.ownerId.toString() === req.user.id;

      if (!canAccess) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "ACCESS_DENIED",
              message: "Access denied",
            },
          },
          { status: 403 }
        );
      }
    }

    // Generate access token
    const token = generateDocumentAccessToken(req.user.id, documentId, 3600);

    return NextResponse.json({
      success: true,
      data: {
        token,
        documentId,
        expiresIn: 3600,
        purpose: purpose || "document_access",
        message: "Access token generated successfully",
      },
    });
  } catch (error) {
    console.error("Token generation error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TOKEN_ERROR",
          message: "Failed to generate access token",
        },
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getDocument);
export const POST = withAuth(generateAccessToken);
