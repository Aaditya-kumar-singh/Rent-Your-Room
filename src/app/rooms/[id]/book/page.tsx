"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

import BookingFormWrapper from "@/components/booking/BookingFormWrapper";

interface RoomWithOwner {
  _id: string;
  title: string;
  description: string;
  monthlyRent: number;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    city: string;
    state: string;
    pincode: string;
  };
  images: string[];
  amenities: string[];
  roomType: string;
  availability: boolean;
  createdAt: Date;
  updatedAt: Date;
  ownerId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    profileImage?: string;
  };
}

interface RoomDetailsResponse {
  success: boolean;
  data?: {
    room: RoomWithOwner;
    message: string;
  };
  error?: {
    code: string;
    message: string;
    details: string;
  };
}

export default function BookRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [room, setRoom] = useState<RoomWithOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const roomId = params.id as string;

  // 1. Handle Authentication Redirect
  useEffect(() => {
    if (status === "unauthenticated") {
      signIn(undefined, { callbackUrl: `/rooms/${roomId}/book` });
    }
  }, [status, roomId]);

  // 2. Fetch Data if Authenticated
  useEffect(() => {
    // If not authenticated, ensure we don't show error state from previous session
    if (status !== "authenticated") {
      setError(null);
      return;
    }
    if (!roomId) return;

    const fetchRoomDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Safe user access
        const user = session?.user as {
          id: string;
          userType: "owner" | "seeker" | "both";
        } | undefined;

        // If session exists but user is missing/incomplete, treat as unauthenticated
        if (!user || !user.id) {
          console.warn("Session user invalid, redirecting to sign in");
          signIn(undefined, { callbackUrl: `/rooms/${roomId}/book` });
          return;
        }



        const response = await fetch(`/api/rooms/${roomId}`);
        const data: RoomDetailsResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || "Failed to fetch room details");
        }

        if (data.success && data.data) {
          const roomData = data.data.room;

          // checks
          if (!roomData.availability) {
            throw new Error("This room is no longer available for booking.");
          }

          if (roomData.ownerId?._id === user.id) {
            throw new Error("You cannot book your own room.");
          }

          setRoom(roomData);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error("Error fetching room details:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetails();
  }, [roomId, status, session]);

  const handleBookingComplete = (booking: { _id: string }) => {
    router.push(`/dashboard?tab=bookings&booking=${booking._id}`);
  };

  const handleCancel = () => {
    router.back();
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Redirecting to login...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Booking Unavailable
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <Link
              href={`/rooms/${roomId}`}
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Room
            </Link>
            <Link
              href="/search"
              className="inline-block bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Search Rooms
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link href="/search" className="hover:text-gray-700">
              Search
            </Link>
            <span>/</span>
            <Link href={`/rooms/${roomId}`} className="hover:text-gray-700">
              Room Details
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Book Room</span>
          </nav>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden min-h-[500px]">
          <div className="p-6 md:p-8">
            {room ? (
              <BookingFormWrapper
                room={room}
                onBookingComplete={handleBookingComplete}
                onCancel={handleCancel}
                className="w-full"
              />
            ) : (
              <div className="text-center text-gray-500">Room data unavailable</div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Need Help?
          </h3>
          <p className="text-blue-800 mb-4">
            If you have any questions about the booking process or need
            assistance, feel free to contact us.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="mailto:support@roomrental.com"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Support
            </a>
            <a
              href="tel:+911234567890"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
