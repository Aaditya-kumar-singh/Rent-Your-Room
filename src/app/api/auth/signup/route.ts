import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import {
  handleError,
  createSuccessResponse,
  AppError,
  ERROR_CODES,
} from "@/utils/errorHandler";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, userType, profileImage } =
      await request.json();

    // Validate input
    if (!email || !password || !name) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Email, password, and name are required",
        400
      );
    }

    if (password.length < 6) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Password must be at least 6 characters long",
        400
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Please provide a valid email address",
        400
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError(
        ERROR_CODES.CONFLICT,
        "User with this email already exists",
        409
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      name: name.trim(),
      password: hashedPassword,
      userType: userType || "seeker",
      profileImage: profileImage || undefined,
      phoneVerified: false,
    });

    // Return user without password
    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      userType: user.userType,
    };

    return createSuccessResponse(
      userResponse,
      "Account created successfully",
      201
    );
  } catch (error) {
    return handleError(error);
  }
}
