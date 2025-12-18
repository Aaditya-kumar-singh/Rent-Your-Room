"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Session } from "next-auth";

// Dynamic imports to prevent hydration issues
const UserProfile = dynamic(() => import("@/components/user/UserProfile"), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted h-96 rounded-lg"></div>,
});

const OwnerDashboard = dynamic(
  () => import("@/components/dashboard/OwnerDashboard"),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-muted h-96 rounded-lg"></div>,
  }
);

const SeekerDashboard = dynamic(
  () => import("@/components/dashboard/SeekerDashboard"),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-muted h-96 rounded-lg"></div>,
  }
);

const OwnerBookingManagement = dynamic(
  () => import("@/components/dashboard/OwnerBookingManagement"),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-muted h-96 rounded-lg"></div>,
  }
);

const SeekerBookingManagement = dynamic(
  () => import("@/components/dashboard/SeekerBookingManagement"),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-muted h-96 rounded-lg"></div>,
  }
);

// Icons
const Icons = {
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Home: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  LogOut: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Menu: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Close: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
};

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // For dual-role users to switch views in Bookings tab
  const [bookingView, setBookingView] = useState<"requests" | "my-bookings">("requests");

  const { data: sessionData, status } = useSession();

  // Use server session as primary source, fall back to client session
  const effectiveSession = session || sessionData;

  // Extract userType with proper type assertion
  const user = effectiveSession?.user as typeof effectiveSession.user & {
    userType?: "owner" | "seeker" | "both" | "admin";
  };

  const userType = user?.userType;
  const isOwner = userType === "owner" || userType === "both";
  const isSeeker = userType === "seeker" || userType === "both";

  // Set default booking view based on role
  useEffect(() => {
    if (userType === "seeker") {
      setBookingView("my-bookings");
    } else {
      setBookingView("requests");
    }
  }, [userType]);

  // Set hydrated flag after mount to avoid SSR mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Redirect to user-type selection if needed (only after hydration)
  useEffect(() => {
    if (isHydrated && effectiveSession?.user && !userType) {
      window.location.href = "/auth/user-type";
    }
  }, [isHydrated, effectiveSession?.user, userType]);

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/", redirect: true });
    } catch {
      window.location.href = "/";
    }
  };

  // Show loading only when truly needed
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // If no session after hydration, redirect to sign in
  if (!effectiveSession) {
    if (typeof window !== 'undefined') {
      window.location.href = "/auth/signin";
    }
    return null;
  }

  // If no userType after hydration, show message (will redirect via useEffect)
  if (!userType) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground text-sm">Setting up your account...</p>
        </div>
      </div>
    );
  }

  const NavItem = ({ id, label, icon: Icon }: { id: string; label: string; icon: any }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === id
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
    >
      <Icon />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex" suppressHydrationWarning>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 h-screen z-50 w-64 bg-card border-r border-border shrink-0 overflow-y-auto transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="h-full flex flex-col p-4">
          {/* Logo */}
          <div className="flex items-center gap-2 px-2 py-4 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
              R
            </div>
            <span className="text-lg font-bold tracking-tight">RentalRooms</span>
          </div>

          {/* User Brief */}
          {effectiveSession && (
            <div className="mb-6 p-3 bg-muted/50 rounded-xl flex items-center gap-3">
              <div className="relative w-10 h-10 shrink-0">
                {effectiveSession.user?.image ? (
                  <Image
                    src={effectiveSession.user.image}
                    alt={effectiveSession.user.name || "User"}
                    fill
                    className="rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                    {effectiveSession.user?.name?.[0] || "U"}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{effectiveSession.user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{userType}</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="space-y-1">
            <NavItem id="dashboard" label={userType === 'both' ? 'Overview' : 'Dashboard'} icon={Icons.Dashboard} />

            {userType === 'both' && (
              <>
                <NavItem id="owner" label="Owner Dashboard" icon={Icons.Home} />
                <NavItem id="seeker" label="Seeker Dashboard" icon={Icons.Home} />
              </>
            )}

            {(isOwner || isSeeker) && (
              <NavItem id="bookings" label="Bookings" icon={Icons.Calendar} />
            )}

            <NavItem id="profile" label="Profile" icon={Icons.User} />
          </nav>

          {/* Footer Actions - Moved up by removing mt-auto */}
          <div className="pt-4 border-t border-border mt-4">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            >
              <Icons.LogOut />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-30">
          <span className="font-semibold">RentalRooms</span>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
          >
            <Icons.Menu />
          </button>
        </header>

        {/* Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Page Title / Breadcrumb */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {activeTab === 'dashboard' && (userType === 'both' ? 'Complete Overview' : 'Dashboard')}
                {activeTab === 'owner' && 'Owner Dashboard'}
                {activeTab === 'seeker' && 'Seeker Dashboard'}
                {activeTab === 'bookings' && 'Booking Management'}
                {activeTab === 'profile' && 'Your Profile'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {activeTab === 'dashboard' && userType === 'both' && 'Manage both your properties and room search in one place.'}
                {activeTab === 'dashboard' && userType !== 'both' && 'Welcome back to your dashboard.'}
                {activeTab === 'owner' && 'Manage your properties, listings, and bookings.'}
                {activeTab === 'seeker' && 'Find and manage your room bookings.'}
                {activeTab === 'profile' && 'Manage your account settings and preferences.'}
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm">
              {activeTab === "dashboard" && (
                <div className="p-6">
                  {userType === "owner" && <OwnerDashboard />}
                  {userType === "seeker" && <SeekerDashboard />}
                  {userType === "both" && (
                    <div className="space-y-8">
                      {/* Info Banner for Both Users */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                              Dual Role Account
                            </h3>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              You have access to both Owner and Seeker features. Use the sidebar to switch between "Owner Dashboard" and "Seeker Dashboard" for focused views, or stay here for a complete overview.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Owner Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                              <span className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                <Icons.Home />
                              </span>
                              Owner Dashboard
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                              Manage your properties and rental listings
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveTab('owner')}
                            className="text-sm text-primary hover:underline font-medium"
                          >
                            View Full Dashboard →
                          </button>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-6">
                          <OwnerDashboard />
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-card px-4 text-sm text-muted-foreground font-medium">
                            Switch Role
                          </span>
                        </div>
                      </div>

                      {/* Seeker Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                              <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Icons.Dashboard />
                              </span>
                              Seeker Dashboard
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                              Search and manage your room bookings
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveTab('seeker')}
                            className="text-sm text-primary hover:underline font-medium"
                          >
                            View Full Dashboard →
                          </button>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-6">
                          <SeekerDashboard />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "owner" && userType === "both" && (
                <div className="p-6">
                  <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className="hover:text-foreground transition-colors"
                    >
                      Overview
                    </button>
                    <span>/</span>
                    <span className="text-foreground font-medium">Owner Dashboard</span>
                  </div>
                  <OwnerDashboard />
                </div>
              )}

              {activeTab === "seeker" && userType === "both" && (
                <div className="p-6">
                  <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className="hover:text-foreground transition-colors"
                    >
                      Overview
                    </button>
                    <span>/</span>
                    <span className="text-foreground font-medium">Seeker Dashboard</span>
                  </div>
                  <SeekerDashboard />
                </div>
              )}

              {activeTab === "profile" && <UserProfile />}

              {activeTab === "bookings" && (
                <div className="p-6">
                  {userType === "both" && (
                    <div className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
                      <button
                        onClick={() => setBookingView("requests")}
                        className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
                          ${bookingView === "requests"
                            ? "bg-white text-blue-700 shadow"
                            : "text-gray-500 hover:text-gray-700"
                          }`}
                      >
                        Received Requests (Owner)
                      </button>
                      <button
                        onClick={() => setBookingView("my-bookings")}
                        className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
                          ${bookingView === "my-bookings"
                            ? "bg-white text-blue-700 shadow"
                            : "text-gray-500 hover:text-gray-700"
                          }`}
                      >
                        My Bookings (Seeker)
                      </button>
                    </div>
                  )}

                  {(userType === "owner" || (userType === "both" && bookingView === "requests")) && (
                    <OwnerBookingManagement />
                  )}

                  {(userType === "seeker" || (userType === "both" && bookingView === "my-bookings")) && (
                    <SeekerBookingManagement />
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
