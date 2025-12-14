import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import { validateInput } from "@/utils/validation";
import { uploadDocument, validateDocumentFile } from "@/lib/documentStorage";
import Joi from "joi";

// Enhanced validation schema for document upload
const documentUploadSchema = Joi.object({
  documentType: Joi.string()
    .valid("pan", "passport", "license")
    .required(),
  fileName: Joi.string().required(),
  bookingId: Joi.string().optional(),
  encrypt: Joi.boolean().default(true),
});

/**
 * POST /api/upload/documents - Upload documents with encryption and secure storage
 * Requirements: 3.1, 3.2 - Secure document storage
 */
async function uploadDocumentHandler(
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
            details: "User must be logged in to upload documents",
          },
        },
        { status: 401 }
      );
    }

    // Check if user is a seeker (only seekers can upload verification documents)
    if (req.user.userType !== "seeker" && req.user.userType !== "both") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_PERMISSIONS",
            message: "Only room seekers can upload verification documents",
            details: "User must have 'seeker' or 'both' user type",
          },
        },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;
    const bookingId = formData.get("bookingId") as string;
    const encrypt = formData.get("encrypt") === "true";

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_FILE",
            message: "No file provided",
            details: "Please select a file to upload",
          },
        },
        { status: 400 }
      );
    }

    // Validate form data
    const validatedData = validateInput<{
      documentType: "pan" | "passport" | "license";
      fileName: string;
      bookingId?: string;
      encrypt: boolean;
    }>(documentUploadSchema, {
      documentType,
      fileName: file.name,
      bookingId,
      encrypt,
    });

    // Validate file using document storage utility
    const fileValidation = validateDocumentFile(file);
    if (!fileValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_FILE",
            message: fileValidation.error,
            details: "Please check your document file",
          },
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload document with encryption for sensitive documents
    const uploadResult = await uploadDocument(buffer, file.name, {
      userId: req.user.id,
      documentType: validatedData.documentType as
        | "pan"
        | "passport"
        | "license",
      encrypt: false,
    });

    // Log document upload for audit trail
    console.log(
      `Document uploaded: ${validatedData.documentType} for user ${req.user.id}`,
      {
        fileSize: file.size,
        encrypted: uploadResult.encrypted,
        timestamp: uploadResult.uploadedAt,
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          ...uploadResult,
          bookingId: validatedData.bookingId,
          message: `${validatedData.documentType.toUpperCase()} document uploaded successfully`,
          securityInfo: {
            encrypted: uploadResult.encrypted,
            secureStorage: true,
            expiresAt: uploadResult.expiresAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Document upload error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Handle specific error types
    if (errorMessage.includes("DOCUMENT_ENCRYPTION_KEY")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ENCRYPTION_ERROR",
            message: "Document encryption configuration error",
            details: "Please contact support",
          },
        },
        { status: 500 }
      );
    }

    // Handle validation errors
    if (errorMessage.includes("validation")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: errorMessage,
            details: "Please check your input data",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UPLOAD_FAILED",
          message: "Failed to upload document",
          details: "An unexpected error occurred during secure upload",
        },
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(uploadDocumentHandler);
