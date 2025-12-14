import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBooking extends Document {
  roomId: Types.ObjectId;
  seekerId: Types.ObjectId;
  ownerId: Types.ObjectId;
  status: "pending" | "paid" | "confirmed" | "cancelled";

  payment: {
    paymentId?: string;
    orderId?: string;
    amount: number;
    status: "pending" | "completed" | "failed" | "refunded";
    paymentDate?: Date;
    refundDate?: Date;
  };
  requestDate: Date;
  responseDate?: Date;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}



const PaymentSchema = new Schema(
  {
    paymentId: {
      type: String,
    },
    orderId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    paymentDate: {
      type: Date,
    },
    refundDate: {
      type: Date,
    },
  },
  { _id: false }
);

const BookingSchema = new Schema<IBooking>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    seekerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "confirmed", "cancelled"],
      default: "pending",
    },
    payment: {
      type: PaymentSchema,
      required: true,
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    responseDate: {
      type: Date,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better performance
BookingSchema.index({ roomId: 1 });
BookingSchema.index({ seekerId: 1 });
BookingSchema.index({ ownerId: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ requestDate: -1 });
BookingSchema.index({ "payment.status": 1 });

// Compound indexes for common queries
BookingSchema.index({ ownerId: 1, status: 1 });
BookingSchema.index({ seekerId: 1, status: 1 });
BookingSchema.index({ roomId: 1, status: 1 });
BookingSchema.index({ status: 1, requestDate: -1 });

// Note: Allow multiple bookings per room and seeker for testing and flexibility

export default mongoose.models.Booking ||
  mongoose.model<IBooking>("Booking", BookingSchema);
