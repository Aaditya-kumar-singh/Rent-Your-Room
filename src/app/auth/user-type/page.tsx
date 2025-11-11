"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserTypePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userType, setUserType] = useState<"owner" | "seeker" | "both">(
    "seeker"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/user/update-type", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userType }),
      });

      if (response.ok) {
        // Force session refresh by reloading the page
        window.location.href = "/dashboard";
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update user type");
      }
    } catch (error) {
      console.error("Error updating user type:", error);
      setError("An error occurred while updating your preferences");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome, {session.user?.name}!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Let us know what you're looking for
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                I am looking to:
              </label>

              <div className="space-y-3">
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="userType"
                    value="seeker"
                    checked={userType === "seeker"}
                    onChange={(e) => setUserType(e.target.value as "seeker")}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      Find a room
                    </div>
                    <div className="text-sm text-gray-500">
                      I&apos;m looking for a place to rent
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="userType"
                    value="owner"
                    checked={userType === "owner"}
                    onChange={(e) => setUserType(e.target.value as "owner")}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      Rent out my property
                    </div>
                    <div className="text-sm text-gray-500">
                      I have rooms/properties to rent
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="userType"
                    value="both"
                    checked={userType === "both"}
                    onChange={(e) => setUserType(e.target.value as "both")}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      Both
                    </div>
                    <div className="text-sm text-gray-500">
                      I want to find and rent out rooms
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Saving..." : "Continue to Dashboard"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
