"use client";

import { useState, useEffect } from "react";

interface PaymentStatusProps {
  bookingId: string;
  onStatusChange?: (status: string) => void;
}

interface PaymentData {
  paymentId?: string;
  orderId?: string;
  amount: number;
  status: "pending" | "completed" | "failed" | "refunded";
  paymentDate?: string;
  refundDate?: string;
}

export default function PaymentStatus({
  bookingId,
  onStatusChange,
}: PaymentStatusProps) {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPaymentStatus();
  }, [bookingId]);

  const fetchPaymentStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bookings/${bookingId}/payment-status`);
      const result = await response.json();

      if (result.success) {
        setPaymentData(result.data);
        onStatusChange?.(result.data.status);
      } else {
        setError(result.error?.message || "Failed to fetch payment status");
      }
    } catch (err) {
      setError("Failed to fetch payment status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "failed":
        return "text-red-600 bg-red-100";
      case "refunded":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <svg
            className="h-5 w-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "pending":
        return (
          <svg
            className="h-5 w-5 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "failed":
        return (
          <svg
            className="h-5 w-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case "refunded":
        return (
          <svg
            className="h-5 w-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="payment-status-loading">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-status-error">
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="payment-status-empty">
        <div className="text-gray-500 text-sm">
          No payment information available
        </div>
      </div>
    );
  }

  return (
    <div className="payment-status">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">Payment Status</h4>
          <button
            onClick={fetchPaymentStatus}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Refresh
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <div
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                paymentData.status
              )}`}
            >
              {getStatusIcon(paymentData.status)}
              <span className="ml-1 capitalize">{paymentData.status}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="text-sm font-medium">
              ₹{paymentData.amount.toLocaleString()}
            </span>
          </div>

          {paymentData.paymentId && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Payment ID:</span>
              <span className="text-sm font-mono text-gray-800">
                {paymentData.paymentId}
              </span>
            </div>
          )}

          {paymentData.orderId && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Order ID:</span>
              <span className="text-sm font-mono text-gray-800">
                {paymentData.orderId}
              </span>
            </div>
          )}

          {paymentData.paymentDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Payment Date:</span>
              <span className="text-sm">
                {new Date(paymentData.paymentDate).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}

          {paymentData.refundDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Refund Date:</span>
              <span className="text-sm">
                {new Date(paymentData.refundDate).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
