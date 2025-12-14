import {
  emailService,
  BookingNotificationData,
  BookingResponseData,
} from "@/lib/emailService";
import Booking from "@/models/Booking";
import { Types } from "mongoose";

interface PopulatedRoom {
  _id: Types.ObjectId;
  title: string;
  location: {
    address: string;
  };
}

interface PopulatedUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
}

export class NotificationHelper {
  static async sendBookingRequestNotification(
    bookingId: string | Types.ObjectId
  ): Promise<boolean> {
    try {
      const booking = await Booking.findById(bookingId)
        .populate("roomId")
        .populate("ownerId")
        .populate("seekerId");

      if (
        !booking ||
        !booking.roomId ||
        !booking.ownerId ||
        !booking.seekerId
      ) {
        console.error("Booking or related data not found for notification");
        return false;
      }

      const room = booking.roomId as PopulatedRoom;
      const owner = booking.ownerId as PopulatedUser;
      const seeker = booking.seekerId as PopulatedUser;

      const notificationData: BookingNotificationData = {
        ownerName: owner.name,
        seekerName: seeker.name,
        roomTitle: room.title,
        roomAddress: room.location.address,
        bookingId: booking._id.toString(),
        amount: booking.payment.amount,
        requestDate: booking.requestDate.toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        message: booking.message,
      };

      return await emailService.sendBookingRequestNotification(
        owner.email,
        notificationData
      );
    } catch (error) {
      console.error("Error sending booking request notification:", error);
      return false;
    }
  }

  static async sendBookingResponseNotification(
    bookingId: string | Types.ObjectId,
    status: "confirmed" | "cancelled",
    ownerMessage?: string
  ): Promise<boolean> {
    try {
      const booking = await Booking.findById(bookingId)
        .populate("roomId")
        .populate("ownerId")
        .populate("seekerId");

      if (
        !booking ||
        !booking.roomId ||
        !booking.ownerId ||
        !booking.seekerId
      ) {
        console.error("Booking or related data not found for notification");
        return false;
      }

      const room = booking.roomId as PopulatedRoom;
      const owner = booking.ownerId as PopulatedUser;
      const seeker = booking.seekerId as PopulatedUser;

      const notificationData: BookingResponseData = {
        seekerName: seeker.name,
        ownerName: owner.name,
        roomTitle: room.title,
        roomAddress: room.location.address,
        bookingId: booking._id.toString(),
        status,
        responseDate: new Date().toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        ownerMessage,
      };

      return await emailService.sendBookingResponseNotification(
        seeker.email,
        notificationData
      );
    } catch (error) {
      console.error("Error sending booking response notification:", error);
      return false;
    }
  }

  static async sendPaymentConfirmationNotification(
    bookingId: string | Types.ObjectId
  ): Promise<boolean> {
    try {
      const booking = await Booking.findById(bookingId)
        .populate("roomId")
        .populate("ownerId")
        .populate("seekerId");

      if (
        !booking ||
        !booking.roomId ||
        !booking.ownerId ||
        !booking.seekerId
      ) {
        console.error("Booking or related data not found for notification");
        return false;
      }

      const room = booking.roomId as PopulatedRoom;
      const owner = booking.ownerId as PopulatedUser;
      const seeker = booking.seekerId as PopulatedUser;

      const paymentData = {
        ownerName: owner.name,
        seekerName: seeker.name,
        roomTitle: room.title,
        bookingId: booking._id.toString(),
        amount: booking.payment.amount,
        paymentDate:
          booking.payment.paymentDate?.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }) || new Date().toLocaleDateString("en-IN"),
      };

      return await emailService.sendPaymentConfirmationNotification(
        owner.email,
        paymentData
      );
    } catch (error) {
      console.error("Error sending payment confirmation notification:", error);
      return false;
    }
  }

  static async sendBulkNotifications(
    bookingIds: (string | Types.ObjectId)[],
    type: "booking_request" | "booking_response" | "payment_confirmation",
    additionalData?: Record<string, unknown>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const bookingId of bookingIds) {
      try {
        let result = false;

        switch (type) {
          case "booking_request":
            result = await this.sendBookingRequestNotification(bookingId);
            break;
          case "booking_response":
            result = await this.sendBookingResponseNotification(
              bookingId,
              additionalData?.status as "confirmed" | "cancelled",
              additionalData?.ownerMessage as string
            );
            break;
          case "payment_confirmation":
            result = await this.sendPaymentConfirmationNotification(bookingId);
            break;
        }

        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(
          `Error processing notification for booking ${bookingId}:`,
          error
        );
        failed++;
      }
    }

    return { success, failed };
  }
}

// Convenience functions for direct use
export const sendBookingRequestNotification =
  NotificationHelper.sendBookingRequestNotification;
export const sendBookingResponseNotification =
  NotificationHelper.sendBookingResponseNotification;
export const sendPaymentConfirmationNotification =
  NotificationHelper.sendPaymentConfirmationNotification;
