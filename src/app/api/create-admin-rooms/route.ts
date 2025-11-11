import { NextRequest } from "next/server";
import { createAdminRooms } from "@/scripts/createAdminRooms";
import { handleError, createSuccessResponse } from "@/utils/errorHandler";

export async function POST(request: NextRequest) {
  try {
    const rooms = await createAdminRooms();

    return createSuccessResponse(
      {
        roomsCreated: rooms.length,
        rooms: rooms.map((room) => ({
          id: room._id,
          title: room.title,
          rent: room.monthlyRent,
          location: `${room.location.city}, ${room.location.state}`,
        })),
      },
      "Admin rooms created successfully"
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({
      message: "Use POST method to create admin rooms",
      description: "This will create sample rooms for the admin user",
    }),
    {
      status: 405,
      headers: { "Content-Type": "application/json" },
    }
  );
}
