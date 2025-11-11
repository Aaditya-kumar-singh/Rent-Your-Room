import { NextRequest } from "next/server";
import { migrateSampleData } from "@/scripts/migrateSampleData";
import { handleError, createSuccessResponse } from "@/utils/errorHandler";

export async function POST(request: NextRequest) {
  try {
    const result = await migrateSampleData();

    return createSuccessResponse(
      result,
      "Sample data migration completed successfully"
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({
      message: "Use POST method to run sample data migration",
      description: "This will add the isSampleData field to existing data",
    }),
    {
      status: 405,
      headers: { "Content-Type": "application/json" },
    }
  );
}
