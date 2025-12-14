export interface User {
  _id: string;
  email: string;
  phone?: string;
  name: string;
  profileImage?: string;
  userType: "owner" | "seeker" | "both";
  googleId?: string;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// NextAuth type extensions are now in src/types/next-auth.d.ts

export interface Room {
  _id: string;
  ownerId: string;
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
}

export interface Booking {
  _id: string;
  roomId: string;
  seekerId: string;
  ownerId: string;
  status: "pending" | "verified" | "paid" | "confirmed" | "cancelled";

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

export interface Payment {
  _id: string;
  bookingId: string;
  userId: string;
  paymentGatewayId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: "created" | "pending" | "completed" | "failed" | "refunded";
  paymentMethod: string;
  transactionDate: Date;
  refundAmount?: number;
  refundDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
