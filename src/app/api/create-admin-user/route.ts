import { NextRequest, NextResponse } from "next/server";
import { createAdminUser } from "@/scripts/createAdminUser";

export async function POST(request: NextRequest) {
  try {
    const user = await createAdminUser();

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    return NextResponse.json(
      { error: "Failed to create admin user" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({
      message: "Use POST method to create admin user",
      description:
        "This will create an admin user with email: admin@roomrental.com and password: admin123",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
