import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    const dbUser = await User.findOne({ email: session.user.email });

    return NextResponse.json({
      session: session,
      dbUser: dbUser
        ? {
            _id: dbUser._id,
            email: dbUser.email,
            name: dbUser.name,
            userType: dbUser.userType,
            phoneVerified: dbUser.phoneVerified,
            createdAt: dbUser.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Debug user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
