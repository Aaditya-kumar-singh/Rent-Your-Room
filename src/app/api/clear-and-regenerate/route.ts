import { NextRequest } from "next/server";
import { clearAndRegenerate } from "@/scripts/clearAndRegenerate";
import { handleError, createSuccessResponse } from "@/utils/errorHandler";

export async function POST(request: NextRequest) {
  try {
    const result = await clearAndRegenerate();

    return createSuccessResponse(
      {
        usersCreated: result.users.length,
        roomsCreated: result.rooms.length,
      },
      "Data cleared and sample data regenerated successfully"
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({
      message: "Use POST method to clear all data and regenerate sample data",
      warning: "This will delete ALL existing data!",
    }),
    {
      status: 405,
      headers: { "Content-Type": "application/json" },
    }
  );
}
