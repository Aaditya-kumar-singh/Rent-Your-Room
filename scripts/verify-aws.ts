import { S3Client, PutObjectCommand, ListBucketsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const REGION = process.env.AWS_REGION || "us-east-1";

async function verifySetup() {
    console.log("🔍 Checking AWS Configuration...\n");

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.error("❌ Error: AWS Credentials not found in .env.local");
        return;
    }

    console.log("✅ AWS Credentials found");
    console.log(`📍 Region: ${REGION}`);

    // Test S3
    console.log("\n----------------------------------------");
    console.log("📦 Testing Amazon S3 Connection...");

    const s3 = new S3Client({
        region: REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });

    try {
        const { Buckets } = await s3.send(new ListBucketsCommand({}));
        console.log("✅ Connected to S3!");
        console.log("   Available Buckets:");
        Buckets?.forEach((b) => console.log(`   - ${b.Name}`));

        const bucketName = process.env.AWS_S3_BUCKET_NAME;
        if (bucketName) {
            if (Buckets?.some(b => b.Name === bucketName)) {
                console.log(`✅ Configured bucket '${bucketName}' found.`);

                // Try a test upload
                console.log("   Attempting test upload...");
                await s3.send(new PutObjectCommand({
                    Bucket: bucketName,
                    Key: "test-params-check.txt",
                    Body: "AWS Setup Verification Successful",
                }));
                console.log("✅ Test upload successful!");
            } else {
                console.warn(`⚠️ Warning: Configured bucket '${bucketName}' not found in your account.`);
            }
        } else {
            console.warn("⚠️ Warning: AWS_S3_BUCKET_NAME not set in .env.local");
        }
    } catch (error: any) {
        console.error("❌ S3 Connection Failed:", error.message);
    }
}

verifySetup();
