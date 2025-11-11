/**
 * Utility functions for handling image uploads
 */

export interface ImageUploadResult {
  success: boolean;
  urls?: string[];
  error?: string;
}

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): ImageValidationResult {
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Invalid file type. Only JPEG, PNG, and WebP are allowed",
    };
  }

  if (file.size > maxFileSize) {
    return {
      isValid: false,
      error: "File size must be less than 5MB",
    };
  }

  return { isValid: true };
}

/**
 * Validate multiple image files
 */
export function validateImageFiles(
  files: File[],
  maxCount: number = 10
): ImageValidationResult {
  if (files.length > maxCount) {
    return {
      isValid: false,
      error: `Maximum ${maxCount} files allowed`,
    };
  }

  for (const file of files) {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      return validation;
    }
  }

  return { isValid: true };
}

export interface ImageUploadOptions {
  roomId?: string;
  category?: "room-listing" | "profile";
}

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  size: number;
  filename: string;
  optimized: boolean;
}

export interface EnhancedImageUploadResult {
  success: boolean;
  images?: UploadedImage[];
  urls?: string[];
  count?: number;
  totalSize?: number;
  cloudStorage?: boolean;
  error?: string;
}

/**
 * Upload images to the server with enhanced options
 */
export async function uploadImages(
  files: File[],
  options: ImageUploadOptions = {}
): Promise<EnhancedImageUploadResult> {
  try {
    // Validate files first
    const validation = validateImageFiles(files);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    // Add optional parameters
    if (options.roomId) {
      formData.append("roomId", options.roomId);
    }
    if (options.category) {
      formData.append("category", options.category);
    }

    const response = await fetch("/api/upload/images", {
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
          "Failed to upload images",
      };
    }

    const result = await response.json();
    return {
      success: true,
      images: result.data.images,
      urls: result.data.images.map((img: UploadedImage) => img.url),
      count: result.data.count,
      totalSize: result.data.totalSize,
      cloudStorage: result.data.cloudStorage,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function uploadImagesLegacy(
  files: File[]
): Promise<ImageUploadResult> {
  const result = await uploadImages(files);
  return {
    success: result.success,
    urls: result.urls,
    error: result.error,
  };
}

/**
 * Create image preview URL from file
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
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
 * Resize image if needed (basic implementation)
 */
export function resizeImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 600,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            resolve(file); // Return original if resize fails
          }
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}
