import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import OTP from "@/models/OTP";
import User from "@/models/User";
import {
  validatePhoneNumber,
  formatPhoneNumber,
  generateOTP,
  sendSMS,
  generateOTPMessage,
} from "@/utils/otp";
import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!validatePhoneNumber(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);

    await connectDB();

    // Check if phone number is already verified by another user
    const existingUser = await User.findOne({
      phone: formattedPhone,
      phoneVerified: true,
    });

    if (existingUser) {
      // Get current session to check if it's the same user
      const session = await getServerSession(authOptions);

      if (
        !session ||
        !(session as any).user?.email ||
        existingUser.email !== (session as any).user.email
      ) {
        return NextResponse.json(
          { error: "Phone number is already registered with another account" },
          { status: 409 }
        );
      }
    }

    // Check for recent OTP requests (rate limiting)
    const recentOTP = await OTP.findOne({
      phone: formattedPhone,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) }, // Within last minute
    });

    if (recentOTP) {
      return NextResponse.json(
        { error: "Please wait before requesting another OTP" },
        { status: 429 }
      );
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this phone number
    await OTP.deleteMany({ phone: formattedPhone });

    // Create new OTP record
    await OTP.create({
      phone: formattedPhone,
      otp,
      expiresAt,
      verified: false,
      attempts: 0,
    });

    // Send SMS
    const message = generateOTPMessage(otp);
    const smsSent = await sendSMS(formattedPhone, message);

    if (!smsSent) {
      return NextResponse.json(
        { error: "Failed to send OTP. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "OTP sent successfully",
        phone: formattedPhone,
        expiresIn: 600, // 10 minutes in seconds
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
