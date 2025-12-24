import { S3Client } from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION || process.env.MY_AWS_REGION || "us-east-1";

// Create S3 Client
export const s3Client = new S3Client({
    region: REGION,
    credentials: {
        // Amplify doesn't allow env vars starting with AWS_, so we support MY_AWS_ prefix
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.MY_AWS_KEY || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.MY_AWS_SECRET || "",
    },
});
