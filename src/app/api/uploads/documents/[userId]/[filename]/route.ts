import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";

/**
 * GET /api/uploads/documents/[userId]/[filename] - Serve uploaded documents securely
 * Requirements: 3.1, 3.2 - Secure document access
 */
async function serveDocument(
  req: AuthenticatedRequest,
  context: { params: Promise<{ userId: string; filename: string }> }
): Promise<NextResponse> {
  try {
    const { userId, filename } = await context.params;

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

    // Security check: Users can only access their own documents
    // Property owners can access documents from their booking requests
    const canAccess =
      req.user.id === userId ||
      req.user.userType === "owner" ||
      req.user.userType === "both";

    if (!canAccess) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Access denied",
            details: "You can only access your own documents",
          },
        },
        { status: 403 }
      );
    }

    // Validate filename to prevent directory traversal
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_FILENAME",
            message: "Invalid filename",
            details: "Filename contains invalid characters",
          },
        },
        { status: 400 }
      );
    }

    // Construct file path
    const filePath = path.join(
      process.cwd(),
      "uploads",
      "documents",
      userId,
      filename
    );

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FILE_NOT_FOUND",
            message: "Document not found",
            details: "The requested document does not exist",
          },
        },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await readFile(filePath);

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = "application/octet-stream";

    switch (ext) {
      case ".jpg":
      case ".jpeg":
        contentType = "image/jpeg";
        break;
      case ".png":
        contentType = "image/png";
        break;
      case ".webp":
        contentType = "image/webp";
        break;
      case ".pdf":
        contentType = "application/pdf";
        break;
    }

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        // Prevent embedding in other sites
        "X-Frame-Options": "DENY",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch (error: unknown) {
    console.error("Serve document error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to serve document",
          details: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(serveDocument);
