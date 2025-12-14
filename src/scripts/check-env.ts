import "dotenv/config";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

async function checkEnv() {
    console.log("Checking Environment Configuration...");

    // Load .env.local manually since dotenv/config might only load .env
    const envLocalPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envLocalPath)) {
        console.log("Found .env.local");
        const envConfig = require("dotenv").parse(fs.readFileSync(envLocalPath));
        for (const k in envConfig) {
            process.env[k] = envConfig[k];
        }
    } else {
        console.warn("WARNING: .env.local not found!");
    }

    // 1. Check Google Creds
    const googleId = process.env.GOOGLE_CLIENT_ID;
    const googleSecret = process.env.GOOGLE_CLIENT_SECRET;

    console.log("Google Client ID: " + (googleId ? "Present " + googleId.substring(0, 5) + "..." : "MISSING"));
    console.log("Google Client Secret: " + (googleSecret ? "Present (Hidden)" : "MISSING"));

    // 2. Check NextAuth URL
    console.log("NEXTAUTH_URL: " + (process.env.NEXTAUTH_URL || "MISSING"));
    console.log("NEXTAUTH_SECRET: " + (process.env.NEXTAUTH_SECRET ? "Present" : "MISSING"));

    // 3. Check MongoDB
    const mongoUri = process.env.MONGODB_URI;
    console.log("MongoDB URI: " + (mongoUri ? "Present " + mongoUri.split("@")[1] : "MISSING")); // partial log

    if (mongoUri) {
        try {
            console.log("Attempting MongoDB Connection...");
            await mongoose.connect(mongoUri);
            console.log("SUCCESS: MongoDB Connected!");
            await mongoose.disconnect();
        } catch (error) {
            console.error("FAIL: MongoDB Connection Failed!", error);
        }
    } else {
        console.error("FAIL: Cannot test MongoDB, URI missing.");
    }
}

checkEnv().catch(console.error);
