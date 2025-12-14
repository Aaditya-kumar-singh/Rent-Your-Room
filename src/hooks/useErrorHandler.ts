import { useCallback } from "react";
import { useToastHelpers } from "@/components/common/Toast";

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
    field?: string;
    timestamp?: string;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
    field?: string;
    timestamp?: string;
  };
  message?: string;
}

export const useErrorHandler = () => {
  const { error: showErrorToast, warning: showWarningToast } =
    useToastHelpers();

  const handleApiError = useCallback(
    (error: unknown, context?: string) => {
      console.error("API Error:", error, context);

      // Handle fetch errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        showErrorToast(
          "Network Error",
          "Unable to connect to the server. Please check your internet connection and try again.",
          { duration: 0 }
        );
        return;
      }

      // Handle API response errors
      if (error && typeof error === "object" && "error" in error) {
        const apiError = error as ApiError;
        const errorMessage =
          apiError.error.message || "An unexpected error occurred";
        const errorDetails = apiError.error.details;

        // Show different toast types based on error code
        switch (apiError.error.code) {
          case "UNAUTHORIZED":
          case "SESSION_EXPIRED":
            showErrorToast(
              "Authentication Required",
              "Please log in to continue",
              {
                duration: 0,
                action: {
                  label: "Login",
                  onClick: () => (window.location.href = "/auth/login"),
                },
              }
            );
            break;

          case "FORBIDDEN":
          case "INSUFFICIENT_PERMISSIONS":
            showErrorToast("Access Denied", errorMessage, { duration: 0 });
            break;

          case "VALIDATION_ERROR":
          case "INVALID_INPUT":
            showErrorToast("Invalid Input", errorMessage, { duration: 8000 });
            break;

          case "RATE_LIMIT_EXCEEDED":
          case "TOO_MANY_REQUESTS":
            showWarningToast("Rate Limit Exceeded", errorMessage, {
              duration: 10000,
            });
            break;

          case "RESOURCE_NOT_FOUND":
          case "ROOM_NOT_FOUND":
          case "USER_NOT_FOUND":
          case "BOOKING_NOT_FOUND":
            showErrorToast("Not Found", errorMessage, { duration: 5000 });
            break;

          case "EXTERNAL_SERVICE_ERROR":
          case "PAYMENT_GATEWAY_ERROR":
          case "SMS_SERVICE_ERROR":
          case "EMAIL_SERVICE_ERROR":
            showErrorToast("Service Unavailable", errorMessage, {
              duration: 0,
              action: {
                label: "Retry",
                onClick: () => window.location.reload(),
              },
            });
            break;

          default:
            showErrorToast(
              context || "Error",
              errorMessage,
              errorDetails ? { duration: 8000 } : { duration: 5000 }
            );
        }
        return;
      }

      // Handle JavaScript errors
      if (error instanceof Error) {
        showErrorToast(context || "Error", error.message, { duration: 5000 });
        return;
      }

      // Handle string errors
      if (typeof error === "string") {
        showErrorToast(context || "Error", error, { duration: 5000 });
        return;
      }

      // Fallback for unknown errors
      showErrorToast(
        context || "Error",
        "An unexpected error occurred. Please try again.",
        { duration: 5000 }
      );
    },
    [showErrorToast, showWarningToast]
  );

  const handleFormError = useCallback(
    (error: unknown, fieldName?: string) => {
      if (error && typeof error === "object" && "error" in error) {
        const apiError = error as ApiError;

        if (
          apiError.error.field &&
          fieldName &&
          apiError.error.field === fieldName
        ) {
          // Field-specific error - let the form handle it
          return apiError.error.message;
        }

        // General form error
        showErrorToast("Form Error", apiError.error.message, {
          duration: 8000,
        });
        return null;
      }

      handleApiError(error, "Form Submission");
      return null;
    },
    [handleApiError, showErrorToast]
  );

  const handleAsyncOperation = useCallback(
    async <T>(
      operation: () => Promise<T>,
      options?: {
        loadingMessage?: string;
        successMessage?: string;
        errorContext?: string;
        showSuccessToast?: boolean;
      }
    ): Promise<T | null> => {
      try {
        const result = await operation();

        if (options?.showSuccessToast && options?.successMessage) {
          // Success toast would need to be handled by the caller
          console.log("Success:", options.successMessage);
        }

        return result;
      } catch (error) {
        handleApiError(error, options?.errorContext);
        return null;
      }
    },
    [handleApiError]
  );

  const createApiErrorHandler = useCallback(
    (context: string) => {
      return (error: unknown) => handleApiError(error, context);
    },
    [handleApiError]
  );

  return {
    handleApiError,
    handleFormError,
    handleAsyncOperation,
    createApiErrorHandler,
  };
};

// Utility function to check if a response is an error
export const isApiError = (response: unknown): response is ApiError => {
  if (!response || typeof response !== "object") return false;
  if (!("success" in response)) return false;
  if (!("error" in response)) return false;

  const typedResponse = response as { success: boolean; error: unknown };
  return typedResponse.success === false;
};

// Utility function to extract error message from various error types
export const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === "object" && "error" in error) {
    const apiError = error as ApiError;
    return apiError.error.message || "An unexpected error occurred";
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred";
};

// Utility function to create a standardized fetch wrapper with error handling
export const createApiClient = () => {
  const request = async <T = unknown>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      return data;
    } catch (error) {
      // Re-throw to be handled by the error handler
      throw error;
    }
  };

  return {
    get: <T = unknown>(url: string, options?: RequestInit) =>
      request<T>(url, { method: "GET", ...options }),

    post: <T = unknown>(url: string, body?: unknown, options?: RequestInit) =>
      request<T>(url, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
        ...options,
      }),

    put: <T = unknown>(url: string, body?: unknown, options?: RequestInit) =>
      request<T>(url, {
        method: "PUT",
        body: body ? JSON.stringify(body) : undefined,
        ...options,
      }),

    delete: <T = unknown>(url: string, options?: RequestInit) =>
      request<T>(url, { method: "DELETE", ...options }),

    patch: <T = unknown>(url: string, body?: unknown, options?: RequestInit) =>
      request<T>(url, {
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
        ...options,
      }),
  };
};
