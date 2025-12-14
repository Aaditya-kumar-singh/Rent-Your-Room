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
  createdAt: string;
}

interface Booking {
  _id: string;
  roomId: {
    _id: string;
    title: string;
    monthlyRent: number;
  };
  seekerId: {
    _id: string;
    name: string;
    email: string;
  };
  status: string;
  requestDate: string;

  payment?: {
    status: string;
    amount: number;
  };
}

interface DashboardStats {
  totalRooms: number;
  activeBookings: number;
  pendingRequests: number;
  monthlyEarnings: number;
}

export default function OwnerDashboard() {
  const { data: session } = useSession();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 0,
    activeBookings: 0,
    pendingRequests: 0,
    monthlyEarnings: 0,
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
        // ignore; loading state will proceed below
      }
    }

    if (!userId) {
      console.error(
        "OwnerDashboard: Unable to get user ID from session or profile"
      );
      setLoading(false);
      return;
    }

    try {
      console.log("OwnerDashboard: Fetching data for user ID:", userId);

      const [roomsRes, bookingsRes, statsRes] = await Promise.all([
        fetch(`/api/rooms/owner/${userId}`).catch((err) => {
          console.error("Rooms fetch error:", err);
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500 }
          );
        }),
        fetch(`/api/bookings/user/${userId}?type=owner`).catch((err) => {
          console.error("Bookings fetch error:", err);
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500 }
          );
        }),
        fetch(`/api/dashboard/owner/stats`).catch((err) => {
          console.error("Stats fetch error:", err);
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500 }
          );
        }),
      ]);

      console.log("OwnerDashboard: API responses received");

      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        console.log("Rooms API response:", roomsData);
        setRooms(roomsData.data?.rooms || []);
      } else {
        const errorText = await roomsRes.text();
        console.error("Rooms API error:", roomsRes.status, errorText);
      }

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        console.log("Bookings API response:", bookingsData);
        setBookings(bookingsData.data?.bookings || []);
      } else {
        const errorText = await bookingsRes.text();
        console.error("Bookings API error:", bookingsRes.status, errorText);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        console.log("Stats API response:", statsData);
        setStats(
          statsData.data?.stats || {
            totalRooms: 0,
            activeBookings: 0,
            pendingRequests: 0,
            monthlyEarnings: 0,
          }
        );
      } else {
        const errorText = await statsRes.text();
        console.error("Stats API error:", statsRes.status, errorText);
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

  const handleBookingAction = async (
    bookingId: string,
    action: "approve" | "reject"
  ) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: action === "approve" ? "confirmed" : "cancelled",
        }),
      });

      if (response.ok) {
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error("Error updating booking:", error);
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Rooms</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalRooms}
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Monthly Earnings
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{stats.monthlyEarnings.toLocaleString()}
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
            href="/rooms/create"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add New Room
          </Link>
          <Link
            href="/rooms/manage"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Manage Rooms
          </Link>
        </div>
      </div>

      {/* Recent Rooms */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Rooms</h3>
          <Link
            href="/rooms/manage"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All
          </Link>
        </div>
        {rooms.length === 0 ? (
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No rooms listed yet
            </h4>
            <p className="text-gray-600 mb-4">
              Start by adding your first room listing
            </p>
            <Link
              href="/rooms/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Your First Room
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.slice(0, 6).map((room) => (
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
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${room.availability
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                      }`}
                  >
                    {room.availability ? "Available" : "Occupied"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Booking Requests
          </h3>
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
              No booking requests yet
            </h4>
            <p className="text-gray-600">
              Booking requests will appear here when users are interested in
              your rooms
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.slice(0, 5).map((booking) => (
              <div
                key={booking._id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {booking.roomId.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Request from {booking.seekerId.name} •{" "}
                    {new Date(booking.requestDate).toLocaleDateString()}
                  </p>
                  <div className="flex items-center mt-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${booking.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : booking.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                        }`}
                    >
                      {booking.status.charAt(0).toUpperCase() +
                        booking.status.slice(1)}
                    </span>

                  </div>
                </div>
                {booking.status === "pending" && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        handleBookingAction(booking._id, "approve")
                      }
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleBookingAction(booking._id, "reject")}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
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
