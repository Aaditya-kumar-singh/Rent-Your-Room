import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Middleware to check if user is authenticated and has admin privileges
 */
export async function requireAdmin(request: NextRequest) {
  const session: Session | null = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.userType !== "admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  return null; // No error, user is admin
}

/**
 * Higher-order function to wrap API routes with admin authentication
 */
export function withAdminAuth(
  handler: (request: NextRequest, session: any) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const session: Session | null = await getServerSession(authOptions);
    return handler(request, session);
  };
}
