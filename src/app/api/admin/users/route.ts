import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminService } from "@/services/adminService";

// Input validation helper
function validateQueryParams(searchParams: URLSearchParams) {
  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  const search = searchParams.get("search");

  // Validate page and limit are numbers
  if (page && isNaN(Number(page))) {
    throw new Error("Page must be a valid number");
  }
  if (limit && isNaN(Number(limit))) {
    throw new Error("Limit must be a valid number");
  }

  // Validate search length to prevent abuse
  if (search && search.length > 100) {
    throw new Error("Search query too long");
  }

  return true;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin - session.user is properly typed now
    if (session.user.userType !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Validate input parameters
    try {
      validateQueryParams(searchParams);
    } catch (validationError) {
      return NextResponse.json(
        {
          error:
            validationError instanceof Error
              ? validationError.message
              : "Invalid parameters",
        },
        { status: 400 }
      );
    }

    // Parse and validate pagination parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "10"))
    );

    // Parse filter parameters
    const search = searchParams.get("search") || undefined;
    const userType = searchParams.get("userType") as
      | "owner"
      | "seeker"
      | "both"
      | "admin"
      | undefined;

    // Use service layer for business logic
    const result = await AdminService.getUsers(
      { search, userType },
      { page, limit }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching admin users:", error);

    // More specific error handling
    if (error instanceof Error) {
      // Don't expose internal error details in production
      const isDev = process.env.NODE_ENV === "development";
      return NextResponse.json(
        {
          error: "Failed to fetch users",
          ...(isDev && { details: error.message }),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
// PUT - Update user (e.g., change user type, activate/deactivate)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.userType !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, userType, isActive } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate userType if provided
    if (userType && !["owner", "seeker", "both", "admin"].includes(userType)) {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 });
    }

    const user = await AdminService.getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent admin from deactivating themselves
    if (userId === session.user.id && isActive === false) {
      return NextResponse.json(
        { error: "Cannot deactivate your own account" },
        { status: 400 }
      );
    }

    const updatedUser = await AdminService.updateUserStatus(userId, isActive);

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE - Delete user (soft delete recommended)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.userType !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const user = await AdminService.getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await AdminService.deleteUser(userId);

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
