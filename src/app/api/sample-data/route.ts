import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Room from "@/models/Room";
import { generateSampleData } from "@/scripts/generateSampleData";
import { handleError, createSuccessResponse } from "@/utils/errorHandler";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "stats":
        const sampleUsers = await User.countDocuments({ isSampleData: true });
        const realUsers = await User.countDocuments({
          isSampleData: { $ne: true },
        });
        const sampleRooms = await Room.countDocuments({ isSampleData: true });
        const realRooms = await Room.countDocuments({
          isSampleData: { $ne: true },
        });

        return createSuccessResponse({
          users: {
            sample: sampleUsers,
            real: realUsers,
            total: sampleUsers + realUsers,
          },
          rooms: {
            sample: sampleRooms,
            real: realRooms,
            total: sampleRooms + realRooms,
          },
        });

      default:
        return createSuccessResponse({
          message: "Sample data management API",
          availableActions: ["stats"],
          endpoints: {
            "GET /api/sample-data?action=stats": "Get sample data statistics",
            "POST /api/sample-data": "Generate new sample data",
            "DELETE /api/sample-data": "Clear all sample data",
          },
        });
    }
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { regenerate = true } = body;

    if (regenerate) {
      // Clear existing sample data and generate new
      const result = await generateSampleData();
      return createSuccessResponse(
        {
          usersCreated: result.users.length,
          roomsCreated: result.rooms.length,
          regenerated: true,
        },
        "Sample data regenerated successfully"
      );
    } else {
      // Generate additional sample data without clearing
      await connectDB();

      // This would need a modified version of generateSampleData
      // For now, we'll just regenerate
      const result = await generateSampleData();
      return createSuccessResponse(
        {
          usersCreated: result.users.length,
          roomsCreated: result.rooms.length,
          regenerated: true,
        },
        "Sample data generated successfully"
      );
    }
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE() {
  try {
    await connectDB();

    const deletedUsers = await User.deleteMany({ isSampleData: true });
    const deletedRooms = await Room.deleteMany({ isSampleData: true });

    return createSuccessResponse(
      {
        usersDeleted: deletedUsers.deletedCount,
        roomsDeleted: deletedRooms.deletedCount,
      },
      "Sample data cleared successfully"
    );
  } catch (error) {
    return handleError(error);
  }
}
