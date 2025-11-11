import Payment from "@/models/Payment";
import Booking from "@/models/Booking";
import connectDB from "@/lib/mongodb";

export interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  refundedPayments: number;
}

export interface PaymentFilter {
  userId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Get payment summary for a user
 */
export async function getPaymentSummary(
  userId: string
): Promise<PaymentSummary> {
  await connectDB();

  const pipeline = [
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        completedPayments: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        pendingPayments: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
        },
        refundedPayments: {
          $sum: { $cond: [{ $eq: ["$status", "refunded"] }, 1, 0] },
        },
      },
    },
  ];

  const result = await Payment.aggregate(pipeline);

  if (result.length === 0) {
    return {
      totalPayments: 0,
      totalAmount: 0,
      completedPayments: 0,
      pendingPayments: 0,
      failedPayments: 0,
      refundedPayments: 0,
    };
  }

  return result[0];
}

/**
 * Get filtered payments with pagination
 */
export async function getFilteredPayments(
  filter: PaymentFilter,
  page: number = 1,
  limit: number = 10
) {
  await connectDB();

  // Build query
  const query: Record<string, any> = {};

  if (filter.userId) {
    query.userId = filter.userId;
  }

  if (filter.status) {
    query.status = filter.status;
  }

  if (filter.dateFrom || filter.dateTo) {
    query.createdAt = {};
    if (filter.dateFrom) {
      query.createdAt.$gte = filter.dateFrom;
    }
    if (filter.dateTo) {
      query.createdAt.$lte = filter.dateTo;
    }
  }

  if (filter.minAmount || filter.maxAmount) {
    query.amount = {};
    if (filter.minAmount) {
      query.amount.$gte = filter.minAmount;
    }
    if (filter.maxAmount) {
      query.amount.$lte = filter.maxAmount;
    }
  }

  // Get total count
  const totalCount = await Payment.countDocuments(query);

  // Fetch payments
  const payments = await Payment.find(query)
    .populate({
      path: "bookingId",
      populate: {
        path: "roomId",
        select: "title location.address",
      },
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    payments,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    hasNextPage: page < Math.ceil(totalCount / limit),
    hasPrevPage: page > 1,
  };
}

/**
 * Update payment status and related booking
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: "completed" | "failed" | "refunded",
  additionalData?: {
    paymentMethod?: string;
    transactionDate?: Date;
    refundAmount?: number;
    refundDate?: Date;
  }
) {
  await connectDB();

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error("Payment not found");
  }

  // Update payment
  payment.status = status;
  if (additionalData?.paymentMethod) {
    payment.paymentMethod = additionalData.paymentMethod;
  }
  if (additionalData?.transactionDate) {
    payment.transactionDate = additionalData.transactionDate;
  }
  if (additionalData?.refundAmount) {
    payment.refundAmount = additionalData.refundAmount;
  }
  if (additionalData?.refundDate) {
    payment.refundDate = additionalData.refundDate;
  }

  await payment.save();

  // Update related booking
  const booking = await Booking.findById(payment.bookingId);
  if (booking) {
    booking.payment.status = status;

    if (status === "completed") {
      booking.status = "paid";
      if (additionalData?.transactionDate) {
        booking.payment.paymentDate = additionalData.transactionDate;
      }
    } else if (status === "failed") {
      booking.status = "verified"; // Revert to verified status
    } else if (status === "refunded") {
      booking.status = "cancelled";
      if (additionalData?.refundDate) {
        booking.payment.refundDate = additionalData.refundDate;
      }
    }

    await booking.save();
  }

  return { payment, booking };
}

/**
 * Get payment by gateway order ID
 */
export async function getPaymentByOrderId(orderId: string) {
  await connectDB();

  return await Payment.findOne({ paymentGatewayId: orderId })
    .populate("bookingId")
    .populate("userId", "name email");
}

/**
 * Check if payment can be refunded
 */
export async function canRefundPayment(paymentId: string): Promise<{
  canRefund: boolean;
  reason?: string;
}> {
  await connectDB();

  const payment = await Payment.findById(paymentId);

  if (!payment) {
    return { canRefund: false, reason: "Payment not found" };
  }

  if (payment.status !== "completed") {
    return { canRefund: false, reason: "Payment is not completed" };
  }

  if (payment.status === "refunded") {
    return { canRefund: false, reason: "Payment already refunded" };
  }

  // Check if payment is older than refund policy (e.g., 30 days)
  const refundPolicyDays = 30;
  const paymentDate = payment.transactionDate || payment.createdAt;
  const daysSincePayment = Math.floor(
    (Date.now() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSincePayment > refundPolicyDays) {
    return {
      canRefund: false,
      reason: `Refund period expired (${refundPolicyDays} days)`,
    };
  }

  return { canRefund: true };
}

/**
 * Get monthly payment statistics
 */
export async function getMonthlyPaymentStats(userId: string, year: number) {
  await connectDB();

  const pipeline = [
    {
      $match: {
        userId,
        status: "completed",
        transactionDate: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$transactionDate" },
        totalAmount: { $sum: "$amount" },
        totalPayments: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 as 1 },
    },
  ];

  const results = await Payment.aggregate(pipeline);

  // Fill in missing months with zero values
  const monthlyStats = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const found = results.find((r) => r._id === month);
    return {
      month,
      totalAmount: found?.totalAmount || 0,
      totalPayments: found?.totalPayments || 0,
    };
  });

  return monthlyStats;
}
