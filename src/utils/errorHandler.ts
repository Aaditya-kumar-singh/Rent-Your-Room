import { NextResponse } from "next/server";
import { ValidationError, validateInput } from "./validation";
import Joi from "joi";

// Standard error codes
export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  PHONE_VERIFICATION_REQUIRED: "PHONE_VERIFICATION_REQUIRED",
  SESSION_EXPIRED: "SESSION_EXPIRED",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_FORMAT: "INVALID_FORMAT",
  INVALID_PARAMETER: "INVALID_PARAMETER",

  // Resource Management
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  ROOM_NOT_FOUND: "ROOM_NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  BOOKING_NOT_FOUND: "BOOKING_NOT_FOUND",
  PAYMENT_NOT_FOUND: "PAYMENT_NOT_FOUND",

  // Business Logic
  ROOM_NOT_AVAILABLE: "ROOM_NOT_AVAILABLE",
  BOOKING_ALREADY_EXISTS: "BOOKING_ALREADY_EXISTS",
  CANNOT_BOOK_OWN_ROOM: "CANNOT_BOOK_OWN_ROOM",
  PAYMENT_ALREADY_PROCESSED: "PAYMENT_ALREADY_PROCESSED",
  INVALID_PAYMENT_AMOUNT: "INVALID_PAYMENT_AMOUNT",
  DOCUMENT_VERIFICATION_FAILED: "DOCUMENT_VERIFICATION_FAILED",

  // File Operations
  FILE_UPLOAD_ERROR: "FILE_UPLOAD_ERROR",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",

  // Database
  DATABASE_ERROR: "DATABASE_ERROR",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  CONNECTION_ERROR: "CONNECTION_ERROR",

  // External Services
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  PAYMENT_GATEWAY_ERROR: "PAYMENT_GATEWAY_ERROR",
  SMS_SERVICE_ERROR: "SMS_SERVICE_ERROR",
  EMAIL_SERVICE_ERROR: "EMAIL_SERVICE_ERROR",
  MAPS_SERVICE_ERROR: "MAPS_SERVICE_ERROR",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",

  // Generic
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
  CONFLICT: "CONFLICT",
} as const;

// Error response interface
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
    field?: string;
    timestamp?: string;
  };
}

// Success response interface
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp?: string;
}

// Custom error classes
export class AppError extends Error {
  public code: string;
  public statusCode: number;
  public details?: string;
  public field?: string;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: string,
    field?: string
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.field = field;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required", details?: string) {
    super(ERROR_CODES.UNAUTHORIZED, message, 401, details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions", details?: string) {
    super(ERROR_CODES.FORBIDDEN, message, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource", details?: string) {
    super(
      ERROR_CODES.RESOURCE_NOT_FOUND,
      `${resource} not found`,
      404,
      details
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: string) {
    super(ERROR_CODES.CONFLICT, message, 409, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded", details?: string) {
    super(ERROR_CODES.RATE_LIMIT_EXCEEDED, message, 429, details);
  }
}

// Error handler function
export const handleError = (error: unknown): NextResponse<ErrorResponse> => {
  console.error("API Error:", error);

  // Handle custom app errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          field: error.field,
          timestamp: new Date().toISOString(),
        },
      },
      { status: error.statusCode }
    );
  }

  // Handle validation errors
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: error.message,
          details: "Please check your input data",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 }
    );
  }

  // Handle MongoDB errors
  if (error && typeof error === "object" && "code" in error) {
    const mongoError = error as {
      code: number | string;
      keyPattern?: Record<string, unknown>;
    };

    // Duplicate key error
    if (mongoError.code === 11000) {
      const field = Object.keys(mongoError.keyPattern || {})[0] || "field";
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.DUPLICATE_ENTRY,
            message: `A record with this ${field} already exists`,
            details: "Please use a different value",
            field,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 409 }
      );
    }

    // Connection error
    if (mongoError.code === "ECONNREFUSED" || mongoError.code === "ENOTFOUND") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.CONNECTION_ERROR,
            message: "Database connection failed",
            details: "Please try again later",
            timestamp: new Date().toISOString(),
          },
        },
        { status: 503 }
      );
    }
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes("validation")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: error.message,
            details: "Please check your input data",
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    if (error.message.includes("not found")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.RESOURCE_NOT_FOUND,
            message: error.message,
            details: "The requested resource could not be found",
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    if (
      error.message.includes("unauthorized") ||
      error.message.includes("authentication")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: error.message,
            details: "Please log in to access this resource",
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }
  }

  // Default internal server error
  return NextResponse.json(
    {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: "An unexpected error occurred",
        details: "Please try again later",
        timestamp: new Date().toISOString(),
      },
    },
    { status: 500 }
  );
};

// Success response helper
export const createSuccessResponse = <T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse<SuccessResponse<T>> => {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
};

// Async error wrapper for API routes
export const asyncHandler = (
  fn: (req: unknown, context?: unknown) => Promise<NextResponse>
) => {
  return async (req: unknown, context?: unknown): Promise<NextResponse> => {
    try {
      return await fn(req, context);
    } catch (error) {
      return handleError(error);
    }
  };
};

// Validation helper with error handling
export const validateAndHandle = <T>(
  schema: Joi.ObjectSchema,
  data: unknown
): T => {
  try {
    return validateInput(schema, data);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      "Invalid input data",
      400,
      error instanceof Error ? error.message : "Unknown validation error"
    );
  }
};

// Database operation wrapper
export const dbOperation = async <T>(
  operation: () => Promise<T>,
  errorMessage: string = "Database operation failed"
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error("Database operation error:", error);

    if (error instanceof Error) {
      // Preserve well-known validation errors for tests and callers
      if (
        error.message.includes("Invalid room ID format") ||
        error.message.includes("Invalid owner ID format")
      ) {
        throw error;
      }
      throw new AppError(
        ERROR_CODES.DATABASE_ERROR,
        errorMessage,
        500,
        error.message
      );
    }

    throw new AppError(
      ERROR_CODES.DATABASE_ERROR,
      errorMessage,
      500,
      "Unknown database error"
    );
  }
};

// External service operation wrapper
export const externalServiceOperation = async <T>(
  operation: () => Promise<T>,
  serviceName: string,
  errorMessage?: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error(`${serviceName} service error:`, error);

    const message =
      errorMessage || `${serviceName} service is currently unavailable`;

    throw new AppError(
      ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      message,
      503,
      error instanceof Error ? error.message : "Unknown service error"
    );
  }
};

// Rate limiting helper
export const checkRateLimit = (
  identifier: string,
  limit: number,
  windowMs: number,
  storage: Map<string, { count: number; resetTime: number }> = new Map()
): void => {
  const now = Date.now();
  const key = identifier;
  const record = storage.get(key);

  if (!record || now > record.resetTime) {
    storage.set(key, { count: 1, resetTime: now + windowMs });
    return;
  }

  if (record.count >= limit) {
    throw new RateLimitError(
      "Too many requests",
      `Rate limit of ${limit} requests per ${windowMs / 1000} seconds exceeded`
    );
  }

  record.count++;
  storage.set(key, record);
};
