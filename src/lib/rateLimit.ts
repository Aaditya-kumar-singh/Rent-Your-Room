import { NextRequest } from "next/server";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

// Simple in-memory rate limiting (use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: RateLimitConfig) {
  return (request: NextRequest): boolean => {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      request.nextUrl.hostname ||
      "unknown";
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Clean up old entries
    for (const [key, value] of requestCounts.entries()) {
      if (value.resetTime < now) {
        requestCounts.delete(key);
      }
    }

    const current = requestCounts.get(ip);

    if (!current || current.resetTime < now) {
      // First request in window or window expired
      requestCounts.set(ip, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    if (current.count >= config.maxRequests) {
      return false; // Rate limit exceeded
    }

    current.count++;
    return true;
  };
}

// Pre-configured rate limiters
export const adminApiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
});

export const generalApiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // 1000 requests per 15 minutes
});
