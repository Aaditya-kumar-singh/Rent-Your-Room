import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Room from "@/models/Room";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user || user.userType !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get platform statistics
    const [roomStats, userStats] = await Promise.all([
      Room.aggregate([
        {
          $group: {
            _id: null,
            totalRooms: { $sum: 1 },
            availableRooms: {
              $sum: { $cond: [{ $eq: ["$availability", true] }, 1, 0] },
            },
            bookedRooms: {
              $sum: { $cond: [{ $eq: ["$availability", false] }, 1, 0] },
            },
            averageRent: { $avg: "$monthlyRent" },
          },
        },
      ]),
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            totalOwners: {
              $sum: {
                $cond: [{ $in: ["$userType", ["owner", "both"]] }, 1, 0],
              },
            },
            totalSeekers: {
              $sum: {
                $cond: [{ $in: ["$userType", ["seeker", "both"]] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    const stats = {
      totalRooms: roomStats[0]?.totalRooms || 0,
      availableRooms: roomStats[0]?.availableRooms || 0,
      bookedRooms: roomStats[0]?.bookedRooms || 0,
      averageRent: roomStats[0]?.averageRent || 0,
      totalUsers: userStats[0]?.totalUsers || 0,
      totalOwners: userStats[0]?.totalOwners || 0,
      totalSeekers: userStats[0]?.totalSeekers || 0,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
