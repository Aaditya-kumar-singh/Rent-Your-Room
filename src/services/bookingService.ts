import Booking, { IBooking } from "@/models/Booking";
import connectDB from "@/lib/mongodb";
import { Types, FilterQuery } from "mongoose";

export interface BookingFilters {
  status?: "pending" | "paid" | "confirmed" | "cancelled";
  roomId?: string | Types.ObjectId;
  seekerId?: string | Types.ObjectId;
  ownerId?: string | Types.ObjectId;
  dateFrom?: Date;
  dateTo?: Date;
  paymentStatus?: "pending" | "completed" | "failed" | "refunded";
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class BookingService {
  /**
   * Create a new booking request
   */
  static async createBooking(
    bookingData: Partial<IBooking>
  ): Promise<IBooking> {
    await connectDB();

    const booking = new Booking(bookingData);
    return await booking.save();
  }

  /**
   * Find booking by ID
   */
  static async findById(id: string | Types.ObjectId): Promise<IBooking | null> {
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid booking ID format");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const booking: any = await Booking.findById(id).select("-__v").lean();
    return booking as IBooking | null;
  }

  /**
   * Update booking by ID
   */
  static async updateById(
    id: string | Types.ObjectId,
    updateData: Partial<IBooking>
  ): Promise<IBooking | null> {
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid booking ID format");
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select("-__v");

    return updatedBooking;
  }

  /**
   * Delete booking by ID
   */
  static async deleteById(id: string | Types.ObjectId): Promise<boolean> {
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid booking ID format");
    }

    const result = await Booking.findByIdAndDelete(id);
    return !!result;
  }

  /**
   * Get bookings by seeker ID
   */
  static async getBookingsBySeeker(
    seekerId: string | Types.ObjectId,
    options: PaginationOptions = {}
  ): Promise<{
    bookings: IBooking[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    await connectDB();

    if (!Types.ObjectId.isValid(seekerId)) {
      throw new Error("Invalid seeker ID format");
    }

    const {
      page = 1,
      limit = 10,
      sortBy = "requestDate",
      sortOrder = "desc",
    } = options;
    const skip = (page - 1) * limit;

    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const bookings = await Booking.find({ seekerId })
      .select("-__v")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments({ seekerId });
    const totalPages = Math.ceil(total / limit);

    return {
      bookings,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Get bookings by owner ID
   */
  static async getBookingsByOwner(
    ownerId: string | Types.ObjectId,
    options: PaginationOptions = {}
  ): Promise<{
    bookings: IBooking[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    await connectDB();

    if (!Types.ObjectId.isValid(ownerId)) {
      throw new Error("Invalid owner ID format");
    }

    const {
      page = 1,
      limit = 10,
      sortBy = "requestDate",
      sortOrder = "desc",
    } = options;
    const skip = (page - 1) * limit;

    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const bookings = await Booking.find({ ownerId })
      .select("-__v")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments({ ownerId });
    const totalPages = Math.ceil(total / limit);

    return {
      bookings,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Get bookings by room ID
   */
  static async getBookingsByRoom(
    roomId: string | Types.ObjectId,
    options: PaginationOptions = {}
  ): Promise<{
    bookings: IBooking[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    await connectDB();

    if (!Types.ObjectId.isValid(roomId)) {
      throw new Error("Invalid room ID format");
    }

    const {
      page = 1,
      limit = 10,
      sortBy = "requestDate",
      sortOrder = "desc",
    } = options;
    const skip = (page - 1) * limit;

    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const bookings = await Booking.find({ roomId })
      .select("-__v")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments({ roomId });
    const totalPages = Math.ceil(total / limit);

    return {
      bookings,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Search bookings with filters
   */
  static async searchBookings(
    filters: BookingFilters = {},
    options: PaginationOptions = {}
  ): Promise<{
    bookings: IBooking[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    await connectDB();

    const {
      page = 1,
      limit = 10,
      sortBy = "requestDate",
      sortOrder = "desc",
    } = options;
    const skip = (page - 1) * limit;

    // Build query
    const query: FilterQuery<IBooking> = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.roomId) {
      query.roomId = filters.roomId;
    }

    if (filters.seekerId) {
      query.seekerId = filters.seekerId;
    }

    if (filters.ownerId) {
      query.ownerId = filters.ownerId;
    }

    if (filters.paymentStatus) {
      query["payment.status"] = filters.paymentStatus;
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      query.requestDate = {};
      if (filters.dateFrom) {
        query.requestDate.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        query.requestDate.$lte = filters.dateTo;
      }
    }

    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const bookings = await Booking.find(query)
      .select("-__v")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      bookings,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Update booking status
   */
  static async updateStatus(
    id: string | Types.ObjectId,
    status: "pending" | "paid" | "confirmed" | "cancelled",
    responseMessage?: string
  ): Promise<IBooking | null> {
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid booking ID format");
    }

    const updateData: Partial<IBooking> = {
      status,
      responseDate: new Date(),
      updatedAt: new Date(),
    };

    if (responseMessage) {
      updateData.message = responseMessage;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-__v");

    return updatedBooking;
  }



  /**
   * Update payment information
   */
  static async updatePayment(
    id: string | Types.ObjectId,
    paymentData: {
      paymentId?: string;
      orderId?: string;
      status: "pending" | "completed" | "failed" | "refunded";
      paymentDate?: Date;
      refundDate?: Date;
    }
  ): Promise<IBooking | null> {
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid booking ID format");
    }

    const updateData: Record<string, unknown> = {
      "payment.status": paymentData.status,
      updatedAt: new Date(),
    };

    if (paymentData.paymentId) {
      updateData["payment.paymentId"] = paymentData.paymentId;
    }

    if (paymentData.orderId) {
      updateData["payment.orderId"] = paymentData.orderId;
    }

    if (paymentData.paymentDate) {
      updateData["payment.paymentDate"] = paymentData.paymentDate;
    }

    if (paymentData.refundDate) {
      updateData["payment.refundDate"] = paymentData.refundDate;
    }

    // Update booking status based on payment status
    if (paymentData.status === "completed") {
      updateData.status = "paid";
    }

    const updatedBooking = await Booking.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-__v");

    return updatedBooking;
  }

  /**
   * Get booking statistics for owner
   */
  static async getOwnerBookingStats(ownerId: string | Types.ObjectId): Promise<{
    totalBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
  }> {
    await connectDB();

    if (!Types.ObjectId.isValid(ownerId)) {
      throw new Error("Invalid owner ID format");
    }

    const stats = await Booking.aggregate([
      { $match: { ownerId: new Types.ObjectId(ownerId.toString()) } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          pendingBookings: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] },
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$payment.status", "completed"] },
                "$payment.amount",
                0,
              ],
            },
          },
        },
      },
    ]);

    return (
      stats[0] || {
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0,
      }
    );
  }

  /**
   * Check if booking exists and belongs to user
   */
  static async verifyBookingOwnership(
    bookingId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    userRole: "seeker" | "owner"
  ): Promise<boolean> {
    await connectDB();

    if (!Types.ObjectId.isValid(bookingId) || !Types.ObjectId.isValid(userId)) {
      return false;
    }

    const query: FilterQuery<IBooking> = { _id: bookingId };

    if (userRole === "seeker") {
      query.seekerId = userId;
    } else if (userRole === "owner") {
      query.ownerId = userId;
    }

    const booking = await Booking.findOne(query).select("_id");

    return !!booking;
  }

  /**
   * Cancel booking
   */
  static async cancelBooking(
    id: string | Types.ObjectId,
    cancelReason?: string
  ): Promise<IBooking | null> {
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid booking ID format");
    }

    const updateData: Partial<IBooking> = {
      status: "cancelled",
      responseDate: new Date(),
      updatedAt: new Date(),
    };

    if (cancelReason) {
      updateData.message = cancelReason;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-__v");

    return updatedBooking;
  }
}
