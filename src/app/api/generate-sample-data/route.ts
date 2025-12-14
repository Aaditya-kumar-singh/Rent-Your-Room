import { NextRequest } from "next/server";
import { generateSampleData } from "@/scripts/generateSampleData";
import {
  handleError,
  createSuccessResponse,
  AppError,
  ERROR_CODES,
} from "@/utils/errorHandler";

export async function POST(request: NextRequest) {
  try {
    // In production, you might want to add authentication here
    // to prevent unauthorized data generation

    const result = await generateSampleData();

    return createSuccessResponse(
      {
        usersCreated: result.users.length,
        roomsCreated: result.rooms.length,
      },
      "Sample data generated successfully"
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({
      message: "Use POST method to generate sample data",
      endpoint: "/api/generate-sample-data",
    }),
    {
      status: 405,
      headers: { "Content-Type": "application/json" },
    }
  );
}
