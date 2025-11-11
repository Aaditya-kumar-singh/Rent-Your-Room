import { NextRequest, NextResponse } from "next/server";
import { generateLargeDataset } from "@/scripts/generateLargeDataset";

export async function POST(request: NextRequest) {
  try {
    console.log("Starting large dataset generation...");

    const result = await generateLargeDataset();

    return NextResponse.json({
      success: true,
      message: "Large dataset generated successfully",
      data: {
        users: result.users.length,
        rooms: result.totalRooms,
        cities: result.cities,
      },
    });
  } catch (error) {
    console.error("Error generating large dataset:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "GENERATION_FAILED",
          message: "Failed to generate large dataset",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Large dataset generation endpoint",
    info: {
      description: "Use POST to generate 15,000+ rooms across 70+ cities",
      expectedData: {
        users: "200 sample users",
        rooms: "15,000 rooms",
        cities: "70+ Indian cities",
      },
    },
  });
}
