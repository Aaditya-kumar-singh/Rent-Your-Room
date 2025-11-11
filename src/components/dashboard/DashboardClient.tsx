"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Session } from "next-auth";

// Dynamic imports to prevent hydration issues
const UserProfile = dynamic(() => import("@/components/user/UserProfile"), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded"></div>,
});

const OwnerDashboard = dynamic(
  () => import("@/components/dashboard/OwnerDashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-gray-200 h-32 rounded"></div>
    ),
  }
);

const SeekerDashboard = dynamic(
  () => import("@/components/dashboard/SeekerDashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-gray-200 h-32 rounded"></div>
    ),
  }
);

const AdminDashboard = dynamic(
  () => import("@/components/dashboard/AdminDashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-gray-200 h-32 rounded"></div>
    ),
  }
);

const OwnerBookingManagement = dynamic(
  () => import("@/components/dashboard/OwnerBookingManagement"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-gray-200 h-32 rounded"></div>
    ),
  }
);

interface DashboardClientProps {
  session: Session;
  initialTab?: string;
}

export default function DashboardClient({
  session,
  initialTab = "dashboard",
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Use a timeout to avoid synchronous setState in effect
    const timer = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Set default tab based on user type
    if (session?.user?.userType === "admin") {
      setActiveTab("admin");
    }
  }, [session?.user?.userType]);

  // Ensure session and user data are available before accessing userType
  const userType = session?.user?.userType;
  const isOwner = userType === "owner" || userType === "both";
  const isAdmin = userType === "admin";

  // Handle redirect for missing userType
  useEffect(() => {
    if (isHydrated && session?.user && !userType) {
      window.location.href = "/auth/user-type";
    }
  }, [isHydrated, session?.user, userType]);

  const handleSignOut = async () => {
    try {
      const result = await signOut({
        callbackUrl: "/",
        redirect: false,
      });

      if (result?.url) {
        window.location.href = result.url;
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      // Fallback: force redirect
      window.location.href = "/";
    }
  };

  // Show loading state during hydration
  if (!isHydrated || !session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If user doesn't have a userType, show loading
  if (!userType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Room Rental Platform
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
                <span className="text-sm text-gray-600">
                  Welcome, {session.user.name}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isAdmin ? "Admin Dashboard" : "Dashboard"}
          </h2>
          <p className="text-gray-600">
            {isAdmin
              ? "Manage the entire platform, users, and rooms"
              : userType === "both"
              ? "Manage your profile, rooms, and bookings"
              : userType === "owner"
              ? "Manage your rooms and bookings"
              : "Find and manage your room bookings"}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {!isAdmin && (
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "dashboard"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {userType === "both" ? "Overview" : "Dashboard"}
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "admin"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Admin Panel
              </button>
            )}

            {userType === "both" && (
              <>
                <button
                  onClick={() => setActiveTab("owner")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "owner"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Owner Dashboard
                </button>
                <button
                  onClick={() => setActiveTab("seeker")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "seeker"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Seeker Dashboard
                </button>
              </>
            )}

            {isOwner && !isAdmin && (
              <button
                onClick={() => setActiveTab("bookings")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "bookings"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Booking Management
              </button>
            )}

            <button
              onClick={() => setActiveTab("profile")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "profile"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Profile
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "dashboard" && !isAdmin && (
            <>
              {userType === "owner" && <OwnerDashboard />}
              {userType === "seeker" && <SeekerDashboard />}
              {userType === "both" && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Owner Overview
                    </h3>
                    <OwnerDashboard />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Seeker Overview
                    </h3>
                    <SeekerDashboard />
                  </div>
                </div>
              )}
            </>
          )}
          {activeTab === "admin" && isAdmin && <AdminDashboard />}
          {activeTab === "owner" && userType === "both" && <OwnerDashboard />}
          {activeTab === "seeker" && userType === "both" && <SeekerDashboard />}
          {activeTab === "profile" && <UserProfile />}
          {activeTab === "bookings" && isOwner && !isAdmin && (
            <OwnerBookingManagement />
          )}
        </div>
      </main>
    </div>
  );
}
