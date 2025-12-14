import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { handleError, createSuccessResponse } from "@/utils/errorHandler";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    const includeSampleData = searchParams.get("includeSampleData") === "true";

    const query = includeSampleData ? {} : { isSampleData: { $ne: true } };

    const users = await User.find(query)
      .select(
        "name email userType profileImage phoneVerified createdAt isSampleData"
      )
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    return createSuccessResponse({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
