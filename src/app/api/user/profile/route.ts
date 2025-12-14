import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

/**
 * GET /api/user/profile - Get current user profile
 */
async function getUserProfile(
  req: AuthenticatedRequest
): Promise<NextResponse> {
  try {
    if (!req.user) {
      return NextResponse.json(
        {
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        profile: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          userType: user.userType,
          phoneVerified: user.phoneVerified,
          phone: user.phone,
          profileImage: user.profileImage,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Get user profile error:", error);

    return NextResponse.json(
      {
        error: "Failed to retrieve user profile",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/profile - Update current user profile
 */
async function updateUserProfile(
  req: AuthenticatedRequest
): Promise<NextResponse> {
  try {
    if (!req.user) {
      return NextResponse.json(
        {
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, userType, profileImage } = body;

    await connectDB();
    const user = await User.findById(req.user.id);

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Update fields if provided
    if (name) user.name = name;
    if (userType) user.userType = userType;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    return NextResponse.json(
      {
        profile: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          userType: user.userType,
          phoneVerified: user.phoneVerified,
          phone: user.phone,
          profileImage: user.profileImage,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Update user profile error:", error);

    return NextResponse.json(
      {
        error: "Failed to update user profile",
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getUserProfile);
export const PUT = withAuth(updateUserProfile);
