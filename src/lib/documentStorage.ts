import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import crypto from "crypto";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Configure Cloudinary for document storage
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface DocumentUploadOptions {
  userId: string;
  documentType: "aadhaar" | "pan" | "passport" | "license";
  encrypt?: boolean;
}

export interface DocumentUploadResult {
  fileUrl: string;
  publicId?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  documentType: string;
  encrypted: boolean;
  uploadedAt: string;
  expiresAt?: string;
}

/**
 * Encryption key for sensitive documents
 */
const getEncryptionKey = (): string => {
  const key = process.env.DOCUMENT_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("DOCUMENT_ENCRYPTION_KEY environment variable is required");
  }
  return key;
};

/**
 * Encrypt document buffer
 */
export function encryptDocument(buffer: Buffer): {
  encryptedBuffer: Buffer;
  iv: string;
} {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(getEncryptionKey(), "salt", 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipher(algorithm, key);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

  return {
    encryptedBuffer: encrypted,
    iv: iv.toString("hex"),
  };
}

/**
 * Decrypt document buffer
 */
export function decryptDocument(
  encryptedBuffer: Buffer,
  ivHex: string
): Buffer {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(getEncryptionKey(), "salt", 32);
  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipher(algorithm, key);
  const decrypted = Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final(),
  ]);

  return decrypted;
}

/**
 * Upload document to secure cloud storage
 */
export async function uploadDocument(
  buffer: Buffer,
  filename: string,
  options: DocumentUploadOptions
): Promise<DocumentUploadResult> {
  try {
    let finalBuffer = buffer;
    let encrypted = false;
    let iv = "";

    // Encrypt sensitive documents
    if (options.encrypt && options.documentType === "aadhaar") {
      const encryptionResult = encryptDocument(buffer);
      finalBuffer = encryptionResult.encryptedBuffer;
      iv = encryptionResult.iv;
      encrypted = true;
    }

    const timestamp = Date.now();
    const fileExtension = path.extname(filename);
    const secureFileName = `${options.documentType}_${timestamp}${fileExtension}`;

    if (process.env.CLOUDINARY_CLOUD_NAME) {
      // Upload to Cloudinary with restricted access
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: `room-rental/documents/${options.userId}`,
              resource_type: "raw", // For non-image files
              public_id: `${options.documentType}_${timestamp}`,
              access_mode: "authenticated", // Restrict public access
              tags: [
                options.documentType,
                "sensitive",
                encrypted ? "encrypted" : "plain",
              ],
              context: {
                userId: options.userId,
                documentType: options.documentType,
                encrypted: encrypted.toString(),
                iv: iv || "none",
              },
            },
            (
              error: Error | undefined,
              result: UploadApiResponse | undefined
            ) => {
              if (error) reject(error);
              else if (result) resolve(result);
              else reject(new Error("Upload failed"));
            }
          )
          .end(finalBuffer);
      });

      return {
        fileUrl: result.secure_url,
        publicId: result.public_id,
        fileName: filename,
        fileSize: buffer.length,
        fileType: result.format || "unknown",
        documentType: options.documentType,
        encrypted,
        uploadedAt: new Date().toISOString(),
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(), // 30 days
      };
    } else {
      // Fallback to local secure storage
      const uploadDir = path.join(
        process.cwd(),
        "uploads",
        "documents",
        options.userId
      );

      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, secureFileName);
      await writeFile(filePath, finalBuffer);

      // Store metadata for encrypted files
      if (encrypted) {
        const metadataPath = path.join(uploadDir, `${secureFileName}.meta`);
        await writeFile(metadataPath, JSON.stringify({ iv, encrypted: true }));
      }

      return {
        fileUrl: `/uploads/documents/${options.userId}/${secureFileName}`,
        fileName: filename,
        fileSize: buffer.length,
        fileType: fileExtension.slice(1),
        documentType: options.documentType,
        encrypted,
        uploadedAt: new Date().toISOString(),
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      };
    }
  } catch (error) {
    console.error("Document upload error:", error);
    throw new Error("Failed to upload document securely");
  }
}

/**
 * Delete document from storage
 */
export async function deleteDocument(
  fileUrl: string,
  publicId?: string,
  userId?: string
): Promise<void> {
  try {
    if (publicId && process.env.CLOUDINARY_CLOUD_NAME) {
      // Delete from Cloudinary
      await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    } else if (fileUrl.startsWith("/uploads/") && userId) {
      // Delete from local storage
      const filePath = path.join(process.cwd(), fileUrl);
      const metadataPath = `${filePath}.meta`;

      if (existsSync(filePath)) {
        await unlink(filePath);
      }
      if (existsSync(metadataPath)) {
        await unlink(metadataPath);
      }
    }
  } catch (error) {
    console.error("Document deletion error:", error);
    throw new Error("Failed to delete document");
  }
}

/**
 * Validate document file
 */
export function validateDocumentFile(file: File): {
  isValid: boolean;
  error?: string;
} {
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
 * Generate secure access token for document viewing
 */
export function generateDocumentAccessToken(
  userId: string,
  documentId: string,
  expiresIn: number = 3600 // 1 hour
): string {
  const payload = {
    userId,
    documentId,
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  };

  const secret = process.env.DOCUMENT_ACCESS_SECRET || "fallback-secret";
  return crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");
}

/**
 * Verify document access token
 */
export function verifyDocumentAccessToken(
  token: string,
  userId: string,
  documentId: string
): boolean {
  try {
    const secret = process.env.DOCUMENT_ACCESS_SECRET || "fallback-secret";
    const payload = {
      userId,
      documentId,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const expectedToken = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    return token === expectedToken;
  } catch {
    return false;
  }
}
