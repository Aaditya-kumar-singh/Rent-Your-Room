"use client";

import { useState, useEffect } from "react";

interface StatsData {
  users: {
    sample: number;
    real: number;
    total: number;
  };
  rooms: {
    sample: number;
    real: number;
    total: number;
  };
}

export default function GenerateDataPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: {
      usersCreated?: number;
      roomsCreated?: number;
      usersDeleted?: number;
      roomsDeleted?: number;
    };
  } | null>(null);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch("/api/sample-data?action=stats");
      const data = await response.json();
      if (response.ok) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleGenerateData = async () => {
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/sample-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ regenerate: true }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        await fetchStats(); // Refresh stats
      } else {
        setError(data.error || "Failed to generate sample data");
      }
    } catch (error) {
      console.error("Error generating sample data:", error);
      setError("An error occurred while generating sample data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSampleData = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all sample data? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/sample-data", {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        await fetchStats(); // Refresh stats
      } else {
        setError(data.error || "Failed to clear sample data");
      }
    } catch (error) {
      console.error("Error clearing sample data:", error);
      setError("An error occurred while clearing sample data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Sample Data Management
          </h1>

          {/* Current Statistics */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">
              Current Data Statistics
            </h2>
            {statsLoading ? (
              <p className="text-gray-500">Loading statistics...</p>
            ) : stats ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700">Users</h3>
                  <p className="text-sm text-gray-600">
                    Real Users: {stats.users.real}
                  </p>
                  <p className="text-sm text-gray-600">
                    Sample Users: {stats.users.sample}
                  </p>
                  <p className="text-sm font-medium">
                    Total: {stats.users.total}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Rooms</h3>
                  <p className="text-sm text-gray-600">
                    Real Rooms: {stats.rooms.real}
                  </p>
                  <p className="text-sm text-gray-600">
                    Sample Rooms: {stats.rooms.sample}
                  </p>
                  <p className="text-sm font-medium">
                    Total: {stats.rooms.total}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-red-500">Failed to load statistics</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ Sample Data Separation:</strong> Sample data is
                stored separately from real user data. You can generate, clear,
                or regenerate sample data without affecting real users and their
                rooms.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {result && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                <p className="font-medium">Operation completed successfully!</p>
                {result.data?.usersCreated && (
                  <p>Users created: {result.data.usersCreated}</p>
                )}
                {result.data?.roomsCreated && (
                  <p>Rooms created: {result.data.roomsCreated}</p>
                )}
                {result.data?.usersDeleted && (
                  <p>Users deleted: {result.data.usersDeleted}</p>
                )}
                {result.data?.roomsDeleted && (
                  <p>Rooms deleted: {result.data.roomsDeleted}</p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleGenerateData}
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Generating..." : "Generate Sample Data"}
              </button>

              <button
                onClick={handleClearSampleData}
                disabled={isLoading || !stats?.users?.sample}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Clearing..." : "Clear Sample Data"}
              </button>

              <button
                onClick={fetchStats}
                disabled={statsLoading}
                className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {statsLoading ? "Refreshing..." : "Refresh Statistics"}
              </button>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <strong>What will be generated:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>25+ users with realistic profiles and photos</li>
                <li>1000+ room listings across major Indian cities</li>
                <li>Diverse room types, amenities, and pricing</li>
                <li>Realistic location coordinates for map testing</li>
                <li>All marked as sample data (isSampleData: true)</li>
              </ul>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <strong>API Usage:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Add <code>?includeSampleData=true</code> to include sample
                  data in API responses
                </li>
                <li>By default, APIs return only real user data</li>
                <li>Sample data is perfect for testing and development</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
