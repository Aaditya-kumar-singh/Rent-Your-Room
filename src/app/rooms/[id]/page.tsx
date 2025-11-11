"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

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

export default function RoomDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [room, setRoom] = useState<RoomWithOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const roomId = params.id as string;

  useEffect(() => {
    if (!roomId) return;

    const fetchRoomDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/rooms/${roomId}`);
        const data: RoomDetailsResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error?.message || "Failed to fetch room details"
          );
        }

        if (data.success && data.data) {
          setRoom(data.data.room);
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
  }, [roomId]);

  const handleBookRoom = () => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    // Navigate to booking form (will be implemented in next subtask)
    router.push(`/rooms/${roomId}/book`);
  };

  const nextImage = () => {
    if (room && room.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === room.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (room && room.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? room.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading room details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Room Not Found
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/search"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Room Not Found
          </h1>
          <Link
            href="/search"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const user = session?.user as
    | { id: string; userType: "owner" | "seeker" | "both" }
    | undefined;
  const isOwner = user && user.id === room.ownerId._id;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Image Gallery */}
          <div className="relative h-96 md:h-[500px]">
            {room.images && room.images.length > 0 ? (
              <>
                <Image
                  src={room.images[currentImageIndex]}
                  alt={`${room.title} - Image ${currentImageIndex + 1}`}
                  fill
                  className="object-cover"
                  priority
                />

                {/* Image Navigation */}
                {room.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>

                    {/* Image Indicators */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {room.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-3 h-3 rounded-full transition-all ${
                            index === currentImageIndex
                              ? "bg-white"
                              : "bg-white bg-opacity-50 hover:bg-opacity-75"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg
                    className="w-16 h-16 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p>No images available</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Title and Price */}
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {room.title}
                  </h1>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{room.monthlyRent.toLocaleString()}/month
                    </p>
                    <div className="flex items-center">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          room.availability
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {room.availability ? "Available" : "Not Available"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Room Type */}
                <div className="mb-6">
                  <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium capitalize">
                    {room.roomType.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Description
                  </h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {room.description}
                  </p>
                </div>

                {/* Amenities */}
                {room.amenities && room.amenities.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">
                      Amenities
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {room.amenities.map((amenity, index) => (
                        <div
                          key={index}
                          className="flex items-center text-gray-700"
                        >
                          <svg
                            className="w-5 h-5 text-green-500 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="capitalize">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Location
                  </h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 mb-2">
                      {room.location.address}
                    </p>
                    <p className="text-gray-600">
                      {room.location.city}, {room.location.state} -{" "}
                      {room.location.pincode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 p-6 rounded-lg sticky top-8">
                  {/* Owner Information */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Property Owner
                    </h3>
                    <div className="flex items-center">
                      {room.ownerId.profileImage ? (
                        <Image
                          src={room.ownerId.profileImage}
                          alt={room.ownerId.name}
                          width={48}
                          height={48}
                          className="rounded-full mr-3"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                          <span className="text-gray-600 font-medium">
                            {room.ownerId.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {room.ownerId.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {room.ownerId.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {isOwner ? (
                      <div className="space-y-3">
                        <Link
                          href={`/rooms/edit/${room._id}`}
                          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center block"
                        >
                          Edit Listing
                        </Link>
                        <p className="text-sm text-gray-600 text-center">
                          This is your listing
                        </p>
                      </div>
                    ) : (
                      <>
                        {room.availability ? (
                          <button
                            onClick={handleBookRoom}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                          >
                            Book This Room
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full bg-gray-400 text-white py-3 px-4 rounded-lg font-medium cursor-not-allowed"
                          >
                            Not Available
                          </button>
                        )}

                        {room.ownerId.phone && (
                          <a
                            href={`tel:${room.ownerId.phone}`}
                            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors text-center block"
                          >
                            Call Owner
                          </a>
                        )}

                        <a
                          href={`mailto:${room.ownerId.email}?subject=Inquiry about ${room.title}&body=Hi ${room.ownerId.name}, I'm interested in your room listing: ${room.title}`}
                          className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors text-center block"
                        >
                          Email Owner
                        </a>
                      </>
                    )}
                  </div>

                  {/* Room Details */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Room Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Room Type:</span>
                        <span className="text-gray-900 capitalize">
                          {room.roomType.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Rent:</span>
                        <span className="text-gray-900 font-medium">
                          ₹{room.monthlyRent.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Availability:</span>
                        <span
                          className={`font-medium ${
                            room.availability
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {room.availability ? "Available" : "Not Available"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Listed:</span>
                        <span className="text-gray-900">
                          {new Date(room.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
