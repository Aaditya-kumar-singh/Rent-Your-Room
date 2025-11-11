import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import OTP from "@/models/OTP";
import User from "@/models/User";
import { formatPhoneNumber } from "@/utils/otp";
import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  handleError,
  createSuccessResponse,
  validateAndHandle,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  AppError,
  ERROR_CODES,
} from "@/utils/errorHandler";
import { phoneVerificationSchema } from "@/utils/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input data
    const validatedData = validateAndHandle(phoneVerificationSchema, body) as {
      phone: string;
      otp: string;
    };
    const { phone, otp } = validatedData;

    // Get current session
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      throw new AuthenticationError(
        "Authentication required to verify phone number"
      );
    }

    const formattedPhone = formatPhoneNumber(phone);

    await connectDB();

    // Find the OTP record
    const otpRecord = await OTP.findOne({
      phone: formattedPhone,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      throw new AppError(
        ERROR_CODES.INVALID_PARAMETER,
        "Invalid or expired OTP",
        400,
        "Please request a new OTP and try again"
      );
    }

    // Check attempt limit
    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      throw new RateLimitError(
        "Too many failed attempts. Please request a new OTP.",
        "Maximum 3 verification attempts allowed per OTP"
      );
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      const attemptsLeft = 3 - otpRecord.attempts;
      throw new AppError(
        ERROR_CODES.INVALID_PARAMETER,
        "Invalid OTP",
        400,
        `${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining`
      );
    }

    // OTP is valid, mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Update user's phone number and verification status
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      throw new NotFoundError("User", "User account not found");
    }

    // Check if phone number is already verified by another user
    const existingUser = await User.findOne({
      phone: formattedPhone,
      phoneVerified: true,
      _id: { $ne: user._id },
    });

    if (existingUser) {
      throw new AppError(
        ERROR_CODES.CONFLICT,
        "Phone number is already registered with another account",
        409,
        "Please use a different phone number"
      );
    }

    user.phone = formattedPhone;
    user.phoneVerified = true;
    await user.save();

    // Clean up - delete the OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    return createSuccessResponse(
      {
        phone: formattedPhone,
        verified: true,
      },
      "Phone number verified successfully"
    );
  } catch (error) {
    return handleError(error);
  }
}
