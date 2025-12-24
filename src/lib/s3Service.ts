import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./aws";

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";

export async function uploadToS3(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    folder: string = "uploads"
): Promise<string> {
    if (!BUCKET_NAME) {
        throw new Error("AWS_S3_BUCKET_NAME is not defined");
    }

    const key = `${folder}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        // ACL: "public-read", // Verified: Bucket ACLs are enabled
    });

    try {
        await s3Client.send(command);
        // Return the URL. checking region to construct typical S3 URL
        const region = process.env.AWS_REGION || "us-east-1";
        return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
    } catch (error) {
        console.error("S3 Upload Error:", error);
        throw new Error("Failed to upload file to S3");
    }
}

export async function deleteFromS3(fileUrl: string): Promise<void> {
    if (!BUCKET_NAME) return;

    try {
        // Extract key from URL
        // Format: https://bucket.s3.region.amazonaws.com/folder/file
        const urlParts = fileUrl.split(".amazonaws.com/");
        if (urlParts.length < 2) return;

        const key = urlParts[1];

        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        await s3Client.send(command);
    } catch (error) {
        console.error("S3 Delete Error:", error);
        // Don't throw, just log. Deletion failure shouldn't block main flow usually.
    }
}
