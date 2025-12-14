/**
 * Utility functions for handling document uploads
 */

export interface DocumentUploadResult {
  success: boolean;
  data?: {
    fileUrl: string;
    publicId?: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    documentType: string;
    encrypted: boolean;
    uploadedAt: string;
    expiresAt?: string;
    bookingId?: string;
    securityInfo: {
      encrypted: boolean;
      secureStorage: boolean;
      expiresAt?: string;
    };
  };
  error?: string;
}

export interface DocumentValidationResult {
  isValid: boolean;
  error?: string;
}

export interface DocumentUploadOptions {
  documentType: "pan" | "passport" | "license";
  bookingId?: string;
  encrypt?: boolean;
}

/**
 * Validate document file before upload
 */
export function validateDocumentFile(file: File): DocumentValidationResult {
  const maxFileSize = 10 * 1024 * 1024; // 10MB for documents
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error:
        "Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed for documents",
    };
  }

  if (file.size > maxFileSize) {
    return {
      isValid: false,
      error: "File size must be less than 10MB",
    };
  }



  return { isValid: true };
}

/**
 * Upload document to the server
 */
export async function uploadDocument(
  file: File,
  options: DocumentUploadOptions
): Promise<DocumentUploadResult> {
  try {
    // Validate file first
    const validation = validateDocumentFile(file);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", options.documentType);

    if (options.bookingId) {
      formData.append("bookingId", options.bookingId);
    }

    if (options.encrypt !== undefined) {
      formData.append("encrypt", options.encrypt.toString());
    }

    const response = await fetch("/api/upload/documents", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error:
          errorData.error?.message ||
          errorData.error ||
          "Failed to upload document",
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Generate document access token
 */
export async function generateDocumentAccessToken(
  documentId: string,
  bookingId?: string,
  purpose?: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const response = await fetch(`/api/documents/${documentId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookingId,
        purpose: purpose || "document_access",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error?.message || "Failed to generate access token",
      };
    }

    const result = await response.json();
    return {
      success: true,
      token: result.data.token,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Token generation failed",
    };
  }
}

/**
 * Get secure document access URL
 */
export async function getDocumentAccessUrl(
  documentId: string,
  token: string,
  bookingId?: string
): Promise<{ success: boolean; accessUrl?: string; error?: string }> {
  try {
    const params = new URLSearchParams({
      token,
      ...(bookingId && { bookingId }),
    });

    const response = await fetch(`/api/documents/${documentId}?${params}`);

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error?.message || "Failed to get document access",
      };
    }

    const result = await response.json();
    return {
      success: true,
      accessUrl: result.data.accessUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Access failed",
    };
  }
}

/**
 * Create document preview (for images only)
 */
export function createDocumentPreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Preview only available for image files"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error("Failed to create preview"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Get document type display name
 */
export function getDocumentTypeDisplayName(documentType: string): string {
  const displayNames: Record<string, string> = {

    pan: "PAN Card",
    passport: "Passport",
    license: "Driving License",
  };

  return displayNames[documentType] || documentType.toUpperCase();
}

/**
 * Check if document type requires encryption
 */
export function requiresEncryption(documentType: string): boolean {
  const encryptionRequired = ["passport"];
  return encryptionRequired.includes(documentType);
}
