"use client";

import { useState } from "react";

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const createAdminUser = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/create-admin-user", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          "Admin user created successfully! You can now sign in with email: admin@roomrental.com and password: admin123"
        );
      } else {
        setError(data.error || "Failed to create admin user");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Admin Setup
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create an admin user to manage the platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Admin User Details
              </h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> admin@roomrental.com
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Password:</strong> admin123
                </p>
              </div>
            </div>

            {message && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-sm text-green-800">{message}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <button
                onClick={createAdminUser}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Admin User"}
              </button>
            </div>

            <div className="text-center">
              <a
                href="/auth/signin"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Go to Sign In →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
