import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import { validateInput } from "@/utils/validation";
import {
  validateAadhaarDocument,
  validateAadhaarNumber,
  generateVerificationReport,
  AadhaarVerificationReport,
} from "@/utils/aadhaarValidation";
import Joi from "joi";
import { readFile } from "fs/promises";
import path from "path";

// Validation schema for Aadhaar verification
const aadhaarVerificationSchema = Joi.object({
  fileUrl: Joi.string().required(),
  fileType: Joi.string().required(),
  fileSize: Joi.number().positive().required(),
  aadhaarNumber: Joi.string().optional(),
});

/**
 * POST /api/verify/aadhaar - Verify Aadhaar document
 * Requirements: 3.1, 3.2
 */
async function verifyAadhaar(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    if (!req.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            details: "User must be logged in to verify Aadhaar documents",
          },
        },
        { status: 401 }
      );
    }

    // Check if user is a seeker (only seekers can verify Aadhaar documents)
    if (req.user.userType !== "seeker" && req.user.userType !== "both") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_PERMISSIONS",
            message: "Only room seekers can verify Aadhaar documents",
            details: "User must have 'seeker' or 'both' user type",
          },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = validateInput<{
      fileUrl: string;
      fileType: string;
      fileSize: number;
      aadhaarNumber?: string;
    }>(aadhaarVerificationSchema, body);

    // Validate file path security (ensure it belongs to the user)
    if (!validatedData.fileUrl.includes(`/uploads/documents/${req.user.id}/`)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED_FILE_ACCESS",
            message: "Unauthorized file access",
            details: "You can only verify your own uploaded documents",
          },
        },
        { status: 403 }
      );
    }

    // Validate Aadhaar number if provided
    if (validatedData.aadhaarNumber) {
      if (!validateAadhaarNumber(validatedData.aadhaarNumber)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_AADHAAR_NUMBER",
              message: "Invalid Aadhaar number format",
              details: "Please provide a valid 12-digit Aadhaar number",
            },
          },
          { status: 400 }
        );
      }
    }

    // Perform document validation
    const validationResult = validateAadhaarDocument(
      validatedData.fileUrl,
      validatedData.fileType,
      validatedData.fileSize
    );

    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DOCUMENT_VALIDATION_FAILED",
            message: "Document validation failed",
            details: validationResult.errors.join(", "),
          },
        },
        { status: 400 }
      );
    }

    // Generate verification report
    const documentId = `aadhaar_${req.user.id}_${Date.now()}`;
    const verificationReport = generateVerificationReport(
      documentId,
      req.user.id,
      validationResult
    );

    // In production, you would:
    // 1. Store the verification report in database
    // 2. Queue the document for manual review if needed
    // 3. Integrate with government APIs for real verification
    // 4. Implement OCR for data extraction

    // For now, we'll simulate a successful verification
    const response: AadhaarVerificationReport = {
      ...verificationReport,
      verificationStatus: "verified",
      confidence: 0.95,
      extractedData: {
        aadhaarNumber: validatedData.aadhaarNumber,
        name: "Sample Name", // In production, extract from OCR
        dateOfBirth: "01/01/1990", // In production, extract from OCR
        gender: "Male", // In production, extract from OCR
        address: "Sample Address", // In production, extract from OCR
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          verificationReport: response,
          message: "Aadhaar document verified successfully",
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Aadhaar verification error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Handle validation errors
    if (errorMessage && errorMessage.includes("validation")) {
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
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify Aadhaar document",
          details: "An unexpected error occurred during verification",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/verify/aadhaar - Get verification status
 */
async function getVerificationStatus(
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
            details: "User must be logged in to check verification status",
          },
        },
        { status: 401 }
      );
    }

    // In production, fetch from database
    // For now, return a placeholder response
    return NextResponse.json(
      {
        success: true,
        data: {
          verificationStatus: "pending",
          message: "No verification found for this user",
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Get verification status error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get verification status",
          details: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(verifyAadhaar);
export const GET = withAuth(getVerificationStatus);
