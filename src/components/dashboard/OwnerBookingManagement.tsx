"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface AadhaarDocument {
  fileUrl: string;
  verified: boolean;
  verificationDate?: string;
}

interface Payment {
  paymentId?: string;
  orderId?: string;
  amount: number;
  status: "pending" | "completed" | "failed" | "refunded";
  paymentDate?: string;
  refundDate?: string;
}

interface Room {
  _id: string;
  title: string;
  monthlyRent: number;
  location: {
    address: string;
    city: string;
    state: string;
  };
  images: string[];
}

interface Seeker {
  _id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
}

interface Booking {
  _id: string;
  roomId: Room;
  seekerId: Seeker;
  ownerId: string;
  status: "pending" | "verified" | "paid" | "confirmed" | "cancelled";
  aadhaarDocument: AadhaarDocument;
  payment: Payment;
  requestDate: string;
  responseDate?: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

interface BookingResponse {
  success: boolean;
  data: {
    bookings: Booking[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    message: string;
  };
}

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  userType?: string;
}

export default function OwnerBookingManagement() {
  const { data: session } = useSession();
  const userId = (session?.user as ExtendedUser)?.id;
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(
    userId || null
  );
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processingBooking, setProcessingBooking] = useState<string | null>(
    null
  );

  const fetchBookings = useCallback(
    async (page: number = 1, status?: string) => {
      if (!resolvedUserId) return;

      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "10",
        });

        if (status && status !== "all") {
          params.append("status", status);
        }

        const response = await fetch(
          `/api/bookings/user/${resolvedUserId}?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch bookings");
        }

        const data: BookingResponse = await response.json();

        if (data.success) {
          setBookings(data.data.bookings);
          setTotalPages(data.data.pagination.totalPages);
          setCurrentPage(data.data.pagination.page);
        } else {
          throw new Error("Failed to load bookings");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [resolvedUserId]
  );

  const updateBookingStatus = async (
    bookingId: string,
    status: "confirmed" | "cancelled",
    message?: string
  ) => {
    try {
      setProcessingBooking(bookingId);

      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to update booking");
      }

      const data = await response.json();

      if (data.success) {
        // Update the booking in the local state
        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking._id === bookingId
              ? { ...booking, status, responseDate: new Date().toISOString() }
              : booking
          )
        );

        // Show success message
        alert(data.data.message);
      } else {
        throw new Error("Failed to update booking status");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setProcessingBooking(null);
    }
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
    fetchBookings(1, status);
  };

  const handlePageChange = (page: number) => {
    fetchBookings(page, selectedStatus === "all" ? undefined : selectedStatus);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "verified":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Keep resolvedUserId in sync with session id when available
  useEffect(() => {
    if (userId && userId !== resolvedUserId) {
      setResolvedUserId(userId);
    }
  }, [userId, resolvedUserId]);

  useEffect(() => {
    const run = async () => {
      if (resolvedUserId) {
        fetchBookings();
        return;
      }
      // Fallback: fetch profile to obtain user id if session misses it
      try {
        const resp = await fetch("/api/user/profile", { cache: "no-store" });
        if (resp.ok) {
          const data = await resp.json();
          const profileId = data?.profile?.id;
          if (profileId) {
            setResolvedUserId(profileId);
            // fetch after setting id
            fetchBookings(1);
            return;
          }
        }
      } catch {
        // ignore; error UI will show below
      } finally {
        if (!resolvedUserId) {
          setLoading(false);
        }
      }
    };
    run();
  }, [resolvedUserId, fetchBookings]);

  if (!session) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please sign in to view your bookings.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading bookings...</p>
      </div>
    );
  }

  if (!resolvedUserId && !error && bookings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-2">We couldn’t detect your user id yet.</p>
        <button
          onClick={() => fetchBookings(1, selectedStatus === "all" ? undefined : selectedStatus)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => fetchBookings()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
        <div className="flex space-x-2">
          {["all", "pending", "verified", "paid", "confirmed", "cancelled"].map(
            (status) => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedStatus === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 text-lg">No bookings found</p>
          <p className="text-gray-500 mt-2">
            {selectedStatus === "all"
              ? "You haven't received any booking requests yet."
              : `No ${selectedStatus} bookings found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {booking.roomId.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-1">
                    {booking.roomId.location.address},{" "}
                    {booking.roomId.location.city}
                  </p>
                  <p className="text-gray-900 font-medium">
                    {formatCurrency(booking.roomId.monthlyRent)}/month
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    booking.status
                  )}`}
                >
                  {booking.status.charAt(0).toUpperCase() +
                    booking.status.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Seeker Information
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Name:</span>{" "}
                      {booking.seekerId.name}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Email:</span>{" "}
                      {booking.seekerId.email}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Phone:</span>{" "}
                      {booking.seekerId.phone}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Booking Details
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Request Date:</span>{" "}
                      {formatDate(booking.requestDate)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Payment Amount:</span>{" "}
                      {formatCurrency(booking.payment.amount)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Payment Status:</span>{" "}
                      <span
                        className={`px-2 py-1 rounded text-xs ${getStatusColor(
                          booking.payment.status
                        )}`}
                      >
                        {booking.payment.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  Aadhaar Verification
                </h4>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">Status:</span>{" "}
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          booking.aadhaarDocument.verified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {booking.aadhaarDocument.verified
                          ? "Verified"
                          : "Pending"}
                      </span>
                    </p>
                    {booking.aadhaarDocument.verificationDate && (
                      <p className="text-xs text-gray-600 mt-1">
                        Verified on:{" "}
                        {formatDate(booking.aadhaarDocument.verificationDate)}
                      </p>
                    )}
                  </div>
                  <a
                    href={booking.aadhaarDocument.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    View Document
                  </a>
                </div>
              </div>

              {booking.message && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Message from Seeker
                  </h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                    {booking.message}
                  </p>
                </div>
              )}

              {(booking.status === "pending" ||
                booking.status === "verified" ||
                booking.status === "paid") && (
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() =>
                      updateBookingStatus(booking._id, "confirmed")
                    }
                    disabled={
                      processingBooking === booking._id ||
                      booking.payment.status !== "completed" ||
                      !booking.aadhaarDocument.verified
                    }
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {processingBooking === booking._id
                      ? "Processing..."
                      : "Accept Booking"}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt(
                        "Please provide a reason for cancellation:"
                      );
                      if (reason !== null) {
                        updateBookingStatus(booking._id, "cancelled", reason);
                      }
                    }}
                    disabled={processingBooking === booking._id}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {processingBooking === booking._id
                      ? "Processing..."
                      : "Reject Booking"}
                  </button>
                </div>
              )}

              {booking.status === "confirmed" && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-green-600 font-medium text-center">
                    ✓ Booking Confirmed
                  </p>
                  {booking.responseDate && (
                    <p className="text-sm text-gray-600 text-center mt-1">
                      Confirmed on: {formatDate(booking.responseDate)}
                    </p>
                  )}
                </div>
              )}

              {booking.status === "cancelled" && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-red-600 font-medium text-center">
                    ✗ Booking Cancelled
                  </p>
                  {booking.responseDate && (
                    <p className="text-sm text-gray-600 text-center mt-1">
                      Cancelled on: {formatDate(booking.responseDate)}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 rounded-md ${
                currentPage === page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
