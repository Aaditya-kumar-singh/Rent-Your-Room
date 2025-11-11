import { Types } from "mongoose";
import {
  sendBookingRequestNotification,
  sendBookingResponseNotification,
  sendPaymentConfirmationNotification,
} from "@/utils/notificationHelpers";
import Notification from "@/models/Notification";

export interface NotificationData {
  userId: Types.ObjectId | string;
  type:
    | "booking_request"
    | "booking_confirmed"
    | "booking_cancelled"
    | "payment_completed";
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export class NotificationService {
  /**
   * Send notification to user
   * Integrates with email service and in-app notifications
   */
  static async sendNotification(
    notification: NotificationData
  ): Promise<boolean> {
    try {
      // Log notification for debugging
      console.log("Notification sent:", {
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: new Date().toISOString(),
        data: notification.data,
      });

      // Store in-app notification
      await this.storeInAppNotification(notification);

      return true;
    } catch (error) {
      console.error("Failed to send notification:", error);
      return false;
    }
  }

  /**
   * Store in-app notification in database
   */
  private static async storeInAppNotification(
    notification: NotificationData
  ): Promise<void> {
    try {
      const inAppNotification = new Notification({
        userId: new Types.ObjectId(notification.userId.toString()),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        read: false,
      });

      await inAppNotification.save();
    } catch (error) {
      console.error("Failed to store in-app notification:", error);
      throw error;
    }
  }

  /**
   * Send booking request notification to property owner
   */
  static async notifyBookingRequest(
    ownerId: Types.ObjectId | string,
    seekerName: string,
    roomTitle: string,
    bookingId: Types.ObjectId | string
  ): Promise<boolean> {
    try {
      // Send email notification
      await sendBookingRequestNotification(bookingId.toString());

      // Send in-app notification
      return this.sendNotification({
        userId: ownerId,
        type: "booking_request",
        title: "New Booking Request",
        message: `${seekerName} has requested to book your room "${roomTitle}"`,
        data: {
          bookingId: bookingId.toString(),
          seekerName,
          roomTitle,
        },
      });
    } catch (error) {
      console.error("Failed to send booking request notification:", error);
      return false;
    }
  }

  /**
   * Send booking confirmation notification to seeker
   */
  static async notifyBookingConfirmed(
    seekerId: Types.ObjectId | string,
    ownerName: string,
    roomTitle: string,
    bookingId: Types.ObjectId | string
  ): Promise<boolean> {
    try {
      // Send email notification
      await sendBookingResponseNotification(bookingId.toString(), "confirmed");

      // Send in-app notification
      return this.sendNotification({
        userId: seekerId,
        type: "booking_confirmed",
        title: "Booking Confirmed",
        message: `Your booking for "${roomTitle}" has been confirmed by ${ownerName}`,
        data: {
          bookingId: bookingId.toString(),
          ownerName,
          roomTitle,
        },
      });
    } catch (error) {
      console.error("Failed to send booking confirmation notification:", error);
      return false;
    }
  }

  /**
   * Send booking cancellation notification to seeker
   */
  static async notifyBookingCancelled(
    seekerId: Types.ObjectId | string,
    ownerName: string,
    roomTitle: string,
    bookingId: Types.ObjectId | string,
    reason?: string
  ): Promise<boolean> {
    try {
      // Send email notification
      await sendBookingResponseNotification(
        bookingId.toString(),
        "cancelled",
        reason
      );

      // Send in-app notification
      return this.sendNotification({
        userId: seekerId,
        type: "booking_cancelled",
        title: "Booking Cancelled",
        message: `Your booking for "${roomTitle}" has been cancelled by ${ownerName}${
          reason ? `. Reason: ${reason}` : ""
        }`,
        data: {
          bookingId: bookingId.toString(),
          ownerName,
          roomTitle,
          reason,
        },
      });
    } catch (error) {
      console.error("Failed to send booking cancellation notification:", error);
      return false;
    }
  }

  /**
   * Send payment completion notification to owner
   */
  static async notifyPaymentCompleted(
    ownerId: Types.ObjectId | string,
    seekerName: string,
    roomTitle: string,
    amount: number,
    bookingId: Types.ObjectId | string
  ): Promise<boolean> {
    try {
      // Send email notification
      await sendPaymentConfirmationNotification(bookingId.toString());

      // Send in-app notification
      return this.sendNotification({
        userId: ownerId,
        type: "payment_completed",
        title: "Payment Received",
        message: `Payment of ₹${amount} received from ${seekerName} for "${roomTitle}"`,
        data: {
          bookingId: bookingId.toString(),
          seekerName,
          roomTitle,
          amount,
        },
      });
    } catch (error) {
      console.error("Failed to send payment completion notification:", error);
      return false;
    }
  }
}
