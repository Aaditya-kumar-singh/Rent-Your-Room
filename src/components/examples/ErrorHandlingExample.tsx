"use client";

import React, { useState } from "react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ErrorDisplay, LoadingState } from "@/components/common/ErrorDisplay";
import { ToastProvider, useToastHelpers } from "@/components/common/Toast";
import {
  InputField,
  TextAreaField,
  SelectField,
} from "@/components/common/FormField";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useLoadingState } from "@/hooks/useLoadingState";
import {
  validateEmail,
  validateName,
  validatePhoneNumber,
} from "@/utils/clientValidation";

// Example form component demonstrating error handling
const ExampleForm: React.FC = () => {
  const { success, error, warning } = useToastHelpers();
  const { handleApiError } = useErrorHandler();
  const { isLoading, error: loadingError, execute } = useLoadingState();

  const { getFieldProps, validateForm, isValid, errors } = useFormValidation(
    {
      name: "",
      email: "",
      phone: "",
      message: "",
      userType: "",
    },
    {
      name: {
        validator: (value) => validateName(String(value || "")),
        validateOnChange: true,
      },
      email: {
        validator: (value) => validateEmail(String(value || "")),
        validateOnChange: true,
      },
      phone: {
        validator: (value) => validatePhoneNumber(String(value || "")),
        validateOnChange: true,
      },
      message: {
        validator: (value) => {
          const str = String(value || "");
          if (!str) return { isValid: false, error: "Message is required" };
          if (str.length < 10)
            return {
              isValid: false,
              error: "Message must be at least 10 characters",
            };
          return { isValid: true };
        },
      },
      userType: {
        validator: (value) => {
          const str = String(value || "");
          if (!str)
            return { isValid: false, error: "Please select a user type" };
          return { isValid: true };
        },
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationResult = await validateForm();
    if (!validationResult.isValid) {
      error("Form Validation Failed", "Please fix the errors below");
      return;
    }

    await execute(
      async () => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Simulate random success/failure
        if (Math.random() > 0.5) {
          throw new Error("Simulated API error");
        }

        return { success: true };
      },
      {
        onSuccess: () => {
          success(
            "Form Submitted",
            "Your form has been submitted successfully!"
          );
        },
        onError: (err) => {
          handleApiError(err, "Form Submission");
        },
      }
    );
  };

  const triggerError = () => {
    error("Test Error", "This is a test error message");
  };

  const triggerWarning = () => {
    warning("Test Warning", "This is a test warning message");
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Error Handling Example</h1>

      {/* Toast trigger buttons */}
      <div className="mb-6 space-x-4">
        <button
          onClick={triggerError}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Trigger Error Toast
        </button>
        <button
          onClick={triggerWarning}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Trigger Warning Toast
        </button>
      </div>

      {/* Error display example */}
      <ErrorDisplay
        error={
          Object.keys(errors).length > 0 ? Object.values(errors) : undefined
        }
        className="mb-6"
      />

      <LoadingState isLoading={isLoading} error={loadingError || undefined}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <InputField
            label="Full Name"
            required
            {...getFieldProps("name")}
            value={String(getFieldProps("name").value || "")}
            onChange={(value) => getFieldProps("name").onChange(value)}
          />

          <InputField
            type="email"
            label="Email Address"
            required
            {...getFieldProps("email")}
            value={String(getFieldProps("email").value || "")}
            onChange={(value) => getFieldProps("email").onChange(value)}
          />

          <InputField
            type="tel"
            label="Phone Number"
            required
            helpText="Enter your 10-digit Indian mobile number"
            {...getFieldProps("phone")}
            value={String(getFieldProps("phone").value || "")}
            onChange={(value) => getFieldProps("phone").onChange(value)}
          />

          <SelectField
            label="User Type"
            required
            placeholder="Select user type"
            options={[
              { value: "owner", label: "Property Owner" },
              { value: "seeker", label: "Room Seeker" },
              { value: "both", label: "Both" },
            ]}
            {...getFieldProps("userType")}
            value={String(getFieldProps("userType").value || "")}
            onChange={(value) => getFieldProps("userType").onChange(value)}
          />

          <TextAreaField
            label="Message"
            required
            rows={4}
            maxLength={500}
            helpText="Tell us about your requirements"
            {...getFieldProps("message")}
            value={String(getFieldProps("message").value || "")}
            onChange={(value) => getFieldProps("message").onChange(value)}
          />

          <button
            type="submit"
            disabled={!isValid || isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Submitting..." : "Submit Form"}
          </button>
        </form>
      </LoadingState>
    </div>
  );
};

// Component that throws an error to test ErrorBoundary
const ErrorThrowingComponent: React.FC = () => {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error("This is a test error thrown by the component");
  }

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-2">Error Boundary Test</h3>
      <p className="text-gray-600 mb-4">
        Click the button below to trigger an error and test the error boundary.
      </p>
      <button
        onClick={() => setShouldThrow(true)}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Throw Error
      </button>
    </div>
  );
};

// Main example component
const ErrorHandlingExample: React.FC = () => {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <ErrorBoundary>
            <ExampleForm />
          </ErrorBoundary>

          <ErrorBoundary>
            <ErrorThrowingComponent />
          </ErrorBoundary>
        </div>
      </div>
    </ToastProvider>
  );
};

export default ErrorHandlingExample;
