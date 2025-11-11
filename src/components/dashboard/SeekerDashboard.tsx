"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import NotificationCenter from "./NotificationCenter";

interface Room {
  _id: string;
  title: string;
  monthlyRent: number;
  location: {
    address: string;
    city: string;
  };
  images: string[];
  availability: boolean;
}

interface Booking {
  _id: string;
  roomId: {
    _id: string;
    title: string;
    monthlyRent: number;
    images: string[];
    location: {
      address: string;
      city: string;
    };
  };
  ownerId: {
    _id: string;
    name: string;
    email: string;
  };
  status: string;
  requestDate: string;
  aadhaarDocument?: {
    verified: boolean;
  };
  payment?: {
    status: string;
    amount: number;
  };
}

interface SeekerStats {
  totalBookings: number;
  activeBookings: number;
  pendingRequests: number;
  completedBookings: number;
}

export default function SeekerDashboard() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favoriteRooms, setFavoriteRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<SeekerStats>({
    totalBookings: 0,
    activeBookings: 0,
    pendingRequests: 0,
    completedBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    let userId = (session.user as { id?: string }).id;

    // Fallback: fetch profile to resolve user id if missing in session
    if (!userId) {
      try {
        const resp = await fetch("/api/user/profile", { cache: "no-store" });
        if (resp.ok) {
          const data = await resp.json();
          userId = data?.profile?.id;
        }
      } catch {
        // ignore
      }
    }

    if (!userId) {
      console.error(
        "SeekerDashboard: Unable to get user ID from session or profile"
      );
      setLoading(false);
      return;
    }

    try {
      console.log("SeekerDashboard: Fetching data for user ID:", userId);

      const [bookingsRes, favoritesRes, statsRes] = await Promise.all([
        fetch(`/api/bookings/user/${userId}?type=seeker`).catch((err) => {
          console.error("Bookings fetch error:", err);
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500 }
          );
        }),
        fetch(`/api/user/favorites`).catch((err) => {
          console.error("Favorites fetch error:", err);
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500 }
          );
        }),
        fetch(`/api/dashboard/seeker/stats`).catch((err) => {
          console.error("Stats fetch error:", err);
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500 }
          );
        }),
      ]);

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData.data?.bookings || []);
      } else {
        const errorText = await bookingsRes.text();
        console.error(
          "Seeker Bookings API error:",
          bookingsRes.status,
          errorText
        );
      }

      if (favoritesRes.ok) {
        const favoritesData = await favoritesRes.json();
        setFavoriteRooms(favoritesData.data?.rooms || []);
      } else {
        const errorText = await favoritesRes.text();
        console.error("Favorites API error:", favoritesRes.status, errorText);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(
          statsData.data?.stats || {
            totalBookings: 0,
            activeBookings: 0,
            pendingRequests: 0,
            completedBookings: 0,
          }
        );
      } else {
        const errorText = await statsRes.text();
        console.error("Seeker Stats API error:", statsRes.status, errorText);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [session, fetchDashboardData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "paid":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Bookings
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalBookings}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Active Bookings
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.activeBookings}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Pending Requests
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.pendingRequests}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.completedBookings}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/search"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Search Rooms
          </Link>
          <Link
            href="/dashboard?tab=bookings"
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            My Bookings
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            Browse Rooms
          </Link>
        </div>
      </div>

      {/* My Bookings */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">My Bookings</h3>
          <Link
            href="/dashboard?tab=bookings"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All
          </Link>
        </div>
        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No bookings yet
            </h4>
            <p className="text-gray-600 mb-4">
              Start by searching for rooms that match your preferences
            </p>
            <Link
              href="/search"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Search Rooms
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.slice(0, 5).map((booking) => (
              <div
                key={booking._id}
                className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  {booking.roomId.images.length > 0 && (
                    <div className="relative w-16 h-16 rounded-md overflow-hidden">
                      <Image
                        src={booking.roomId.images[0]}
                        alt={booking.roomId.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {booking.roomId.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {booking.roomId.location.address}
                    </p>
                    <p className="text-sm text-gray-500">
                      Owner: {booking.ownerId.name} • Requested:{" "}
                      {new Date(booking.requestDate).toLocaleDateString()}
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status.charAt(0).toUpperCase() +
                          booking.status.slice(1)}
                      </span>
                      {booking.aadhaarDocument?.verified && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Aadhaar Verified
                        </span>
                      )}
                      {booking.payment?.status === "completed" && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Payment Complete
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-blue-600">
                    ₹{booking.roomId.monthlyRent.toLocaleString()}/month
                  </p>
                  <Link
                    href={`/rooms/${booking.roomId._id}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View Room
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Favorite Rooms */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Favorite Rooms
          </h3>
        </div>
        {favoriteRooms.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No favorites yet
            </h4>
            <p className="text-gray-600">
              Save rooms you like to easily find them later
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteRooms.slice(0, 6).map((room) => (
              <div
                key={room._id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {room.images.length > 0 && (
                  <div className="relative h-32 mb-3 rounded-md overflow-hidden">
                    <Image
                      src={room.images[0]}
                      alt={room.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <h4 className="font-medium text-gray-900 mb-1">{room.title}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  {room.location.address}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-blue-600">
                    ₹{room.monthlyRent.toLocaleString()}/month
                  </span>
                  <Link
                    href={`/rooms/${room._id}`}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <NotificationCenter />
    </div>
  );
}
