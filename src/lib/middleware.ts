import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";
import { authOptions } from "./auth";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "./mongodb";
import User from "@/models/User";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    name: string;
    userType: "owner" | "seeker" | "both" | "admin";
    phoneVerified: boolean;
    phone?: string;
  };
}

/**
 * Middleware to validate user session and attach user data to request
 */
export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse>;

export function withAuth<T>(
  handler: (req: AuthenticatedRequest, context: T) => Promise<NextResponse>
): (req: NextRequest, context: T) => Promise<NextResponse>;

export function withAuth<T = unknown>(
  handler: (req: AuthenticatedRequest, context?: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: T) => {
    try {
      const session = await getServerSession(authOptions);

      if (!(session as any)?.user) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      // Attach user data to request
      const authenticatedReq = req as AuthenticatedRequest;
      const sessionUser = (session as any).user;
      authenticatedReq.user = {
        id: sessionUser?.id || "",
        email: sessionUser?.email || "",
        name: sessionUser?.name || "",
        userType: sessionUser?.userType || "seeker",
        phoneVerified: sessionUser?.phoneVerified || false,
        phone: sessionUser?.phone,
      };

      return handler(authenticatedReq, context as T);
    } catch (error) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware to validate user session and require phone verification
 */
export function withPhoneVerification<T = unknown>(
  handler: (req: AuthenticatedRequest, context?: T) => Promise<NextResponse>
) {
  return withAuth(async (req: AuthenticatedRequest, context?: T) => {
    if (!req.user || !req.user.phoneVerified) {
      return NextResponse.json(
        { error: "Phone verification required" },
        { status: 403 }
      );
    }

    return handler(req, context);
  });
}

/**
 * Middleware to validate user type (owner, seeker, or both)
 */
export function withUserType<T = unknown>(
  allowedTypes: ("owner" | "seeker" | "both" | "admin")[],
  handler: (req: AuthenticatedRequest, context?: T) => Promise<NextResponse>
) {
  return withAuth(async (req: AuthenticatedRequest, context?: T) => {
    if (
      !req.user ||
      !req.user.userType ||
      !allowedTypes.includes(req.user.userType)
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    return handler(req, context);
  });
}

/**
 * Get user from database with fresh data
 */
export async function getCurrentUser(email: string) {
  try {
    await connectDB();
    const user = await User.findOne({ email }).select("-__v");
    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Validate session and return user data
 */
export async function validateSession() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session as any).user?.email) {
      return { user: null, session: null };
    }

    const user = await getCurrentUser((session as any).user.email!);

    return { user, session };
  } catch (error) {
    return { user: null, session: null };
  }
}
