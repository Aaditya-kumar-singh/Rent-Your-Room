import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// PUT /api/user/user-type - Update user type
export const PUT = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { userType } = await req.json();

    if (!userType || !["owner", "seeker", "both"].includes(userType)) {
      return NextResponse.json(
        { error: "Valid user type is required (owner, seeker, or both)" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: req.user!.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.userType = userType;
    await user.save();

    return NextResponse.json(
      {
        message: "User type updated successfully",
        userType: user.userType,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update user type error:", error);
    return NextResponse.json(
      { error: "Failed to update user type" },
      { status: 500 }
    );
  }
});
