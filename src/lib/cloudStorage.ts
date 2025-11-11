import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import sharp from "sharp";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface ImageUploadOptions {
  folder: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: "jpg" | "jpeg" | "png" | "webp";
}

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload and optimize image to Cloudinary
 */
export async function uploadImage(
  buffer: Buffer,
  options: ImageUploadOptions
): Promise<UploadResult> {
  try {
    // Optimize image with Sharp before uploading
    let processedBuffer = buffer;

    if (options.width || options.height || options.quality || options.format) {
      const sharpInstance = sharp(buffer);

      // Resize if dimensions provided
      if (options.width || options.height) {
        sharpInstance.resize(options.width, options.height, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      // Convert format and set quality
      if (options.format === "jpg" || options.format === "jpeg") {
        sharpInstance.jpeg({ quality: options.quality || 85 });
      } else if (options.format === "png") {
        sharpInstance.png({ quality: options.quality || 85 });
      } else if (options.format === "webp") {
        sharpInstance.webp({ quality: options.quality || 85 });
      }

      processedBuffer = await sharpInstance.toBuffer();
    }

    // Upload to Cloudinary
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: options.folder,
            resource_type: "image",
            quality: "auto",
            fetch_format: "auto",
          },
          (error: Error | undefined, result: UploadApiResponse | undefined) => {
            if (error) reject(error);
            else if (result) resolve(result);
            else reject(new Error("Upload failed"));
          }
        )
        .end(processedBuffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error("Image upload error:", error);
    throw new Error("Failed to upload image to cloud storage");
  }
}

/**
 * Upload multiple images
 */
export async function uploadMultipleImages(
  files: { buffer: Buffer; filename: string }[],
  options: ImageUploadOptions
): Promise<UploadResult[]> {
  const uploadPromises = files.map((file) => uploadImage(file.buffer, options));

  return Promise.all(uploadPromises);
}

/**
 * Delete image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Image deletion error:", error);
    throw new Error("Failed to delete image from cloud storage");
  }
}

/**
 * Delete multiple images
 */
export async function deleteMultipleImages(publicIds: string[]): Promise<void> {
  try {
    await cloudinary.api.delete_resources(publicIds);
  } catch (error) {
    console.error("Multiple images deletion error:", error);
    throw new Error("Failed to delete images from cloud storage");
  }
}

/**
 * Generate optimized image URL with transformations
 */
export function generateOptimizedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  } = {}
): string {
  return cloudinary.url(publicId, {
    width: options.width,
    height: options.height,
    quality: options.quality || "auto",
    fetch_format: options.format || "auto",
    crop: "fill",
  });
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}
