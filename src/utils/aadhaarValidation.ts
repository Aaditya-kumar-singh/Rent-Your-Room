/**
 * Aadhaar Validation Utilities
 * Requirements: 3.1, 3.2
 */

export interface AadhaarValidationResult {
  isValid: boolean;
  errors: string[];
  extractedData?: {
    aadhaarNumber?: string;
    name?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
  };
}

/**
 * Validate Aadhaar number format
 * Aadhaar numbers are 12-digit numbers
 */
export function validateAadhaarNumber(aadhaarNumber: string): boolean {
  // Remove spaces and hyphens
  const cleanNumber = aadhaarNumber.replace(/[\s-]/g, "");

  // Check if it's exactly 12 digits
  if (!/^\d{12}$/.test(cleanNumber)) {
    return false;
  }

  // Aadhaar numbers don't start with 0 or 1
  if (cleanNumber.startsWith("0") || cleanNumber.startsWith("1")) {
    return false;
  }

  // Apply Verhoeff algorithm for checksum validation
  return verifyVerhoeffChecksum(cleanNumber);
}

/**
 * Verhoeff algorithm implementation for Aadhaar checksum validation
 */
function verifyVerhoeffChecksum(aadhaarNumber: string): boolean {
  // Verhoeff multiplication table
  const multiplicationTable = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  ];

  // Permutation table
  const permutationTable = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
  ];

  let checksum = 0;
  const digits = aadhaarNumber.split("").map(Number).reverse();

  for (let i = 0; i < digits.length; i++) {
    checksum =
      multiplicationTable[checksum][permutationTable[i % 8][digits[i]]];
  }

  return checksum === 0;
}

/**
 * Validate file type for Aadhaar documents
 */
export function validateAadhaarFileType(fileType: string): boolean {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  return allowedTypes.includes(fileType.toLowerCase());
}

/**
 * Validate file size for Aadhaar documents
 */
export function validateAadhaarFileSize(fileSize: number): boolean {
  const maxSize = 5 * 1024 * 1024; // 5MB
  return fileSize <= maxSize;
}

/**
 * Basic validation for Aadhaar document
 * This is a simplified version - in production, you would use OCR services
 * or government APIs for proper validation
 */
export function validateAadhaarDocument(
  fileUrl: string,
  fileType: string,
  fileSize: number
): AadhaarValidationResult {
  const errors: string[] = [];

  // Validate file type
  if (!validateAadhaarFileType(fileType)) {
    errors.push(
      "Invalid file type. Please upload JPEG, PNG, WebP, or PDF files only."
    );
  }

  // Validate file size
  if (!validateAadhaarFileSize(fileSize)) {
    errors.push("File size too large. Maximum allowed size is 5MB.");
  }

  // Basic file URL validation
  if (!fileUrl || !fileUrl.includes("/uploads/documents/")) {
    errors.push("Invalid file URL.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    extractedData: {
      // In a real implementation, you would extract this data using OCR
      // For now, we'll return placeholder data
    },
  };
}

/**
 * Extract Aadhaar number from text (basic regex pattern)
 * In production, use proper OCR services
 */
export function extractAadhaarNumber(text: string): string | null {
  // Pattern to match Aadhaar numbers (12 digits with optional spaces/hyphens)
  const aadhaarPattern = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
  const matches = text.match(aadhaarPattern);

  if (matches) {
    for (const match of matches) {
      const cleanNumber = match.replace(/[\s-]/g, "");
      if (validateAadhaarNumber(cleanNumber)) {
        return cleanNumber;
      }
    }
  }

  return null;
}

/**
 * Mask Aadhaar number for display (show only last 4 digits)
 */
export function maskAadhaarNumber(aadhaarNumber: string): string {
  const cleanNumber = aadhaarNumber.replace(/[\s-]/g, "");
  if (cleanNumber.length !== 12) {
    return "Invalid Aadhaar";
  }

  return `XXXX-XXXX-${cleanNumber.slice(-4)}`;
}

/**
 * Format Aadhaar number with hyphens
 */
export function formatAadhaarNumber(aadhaarNumber: string): string {
  const cleanNumber = aadhaarNumber.replace(/[\s-]/g, "");
  if (cleanNumber.length !== 12) {
    return aadhaarNumber;
  }

  return `${cleanNumber.slice(0, 4)}-${cleanNumber.slice(
    4,
    8
  )}-${cleanNumber.slice(8, 12)}`;
}

/**
 * Validate Aadhaar document security features
 * This is a placeholder for more advanced validation
 */
export function validateSecurityFeatures(fileBuffer: Buffer): Promise<boolean> {
  return new Promise((resolve) => {
    // In production, implement:
    // 1. QR code validation
    // 2. Digital signature verification
    // 3. Hologram detection
    // 4. Font and layout validation
    // 5. Government API verification

    // For now, return true as placeholder
    setTimeout(() => resolve(true), 1000);
  });
}

/**
 * Check if Aadhaar document is expired or invalid
 */
export function isAadhaarDocumentValid(uploadDate: Date): boolean {
  // Aadhaar documents don't expire, but we can check upload recency
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  const now = new Date();
  const timeDiff = now.getTime() - uploadDate.getTime();

  return timeDiff <= maxAge;
}

/**
 * Generate verification report for Aadhaar document
 */
export interface AadhaarVerificationReport {
  documentId: string;
  userId: string;
  verificationStatus: "pending" | "verified" | "rejected";
  verificationDate: Date;
  verificationMethod: string;
  confidence: number;
  issues: string[];
  extractedData: {
    aadhaarNumber?: string;
    name?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
  };
}

export function generateVerificationReport(
  documentId: string,
  userId: string,
  validationResult: AadhaarValidationResult
): AadhaarVerificationReport {
  return {
    documentId,
    userId,
    verificationStatus: validationResult.isValid ? "verified" : "rejected",
    verificationDate: new Date(),
    verificationMethod: "automated_validation",
    confidence: validationResult.isValid ? 0.85 : 0.1,
    issues: validationResult.errors,
    extractedData: validationResult.extractedData || {},
  };
}
