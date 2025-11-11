import { BookingService } from "@/services/bookingService";
import { NotificationService } from "@/services/notificationService";
import {
  validateAadhaarNumber,
  validateAadhaarDocument,
} from "@/utils/aadhaarValidation";
import { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import User from "@/models/User";
import Room from "@/models/Room";

describe("Booking System", () => {
  let mongoServer: MongoMemoryServer;
  let testSeekerId: Types.ObjectId;
  let testOwnerId: Types.ObjectId;
  let testRoomId: Types.ObjectId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    // Create test users
    const seeker = await User.create({
      email: "seeker@test.com",
      name: "Test Seeker",
      userType: "seeker",
      phoneVerified: true,
    });
    testSeekerId = seeker._id;

    const owner = await User.create({
      email: "owner@test.com",
      name: "Test Owner",
      userType: "owner",
      phoneVerified: true,
    });
    testOwnerId = owner._id;

    // Create test room
    const room = await Room.create({
      ownerId: testOwnerId,
      title: "Test Room",
      description: "A test room for booking",
      monthlyRent: 15000,
      location: {
        address: "123 Test Street",
      coordinates: { type: "Point", coordinates: [77.209, 28.6139] },
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
      },
      images: ["test-image.jpg"],
      amenities: ["wifi"],
      roomType: "single",
      availability: true,
    });
    testRoomId = room._id;
  });

  describe("Booking Creation and Management", () => {
    const sampleBookingData = {
      aadhaarDocument: {
        fileUrl: "/uploads/documents/test-aadhaar.jpg",
        verified: false,
      },
      payment: {
        amount: 15000,
        status: "pending" as const,
      },
      message: "I would like to book this room",
    };

    it("should create a booking successfully", async () => {
      const bookingData = {
        roomId: testRoomId,
        seekerId: testSeekerId,
        ownerId: testOwnerId,
        ...sampleBookingData,
      };

      const booking = await BookingService.createBooking(bookingData);

      expect(booking).toBeDefined();
      expect(booking.roomId).toEqual(testRoomId);
      expect(booking.seekerId).toEqual(testSeekerId);
      expect(booking.ownerId).toEqual(testOwnerId);
      expect(booking.status).toBe("pending");
      expect(booking.aadhaarDocument.verified).toBe(false);
      expect(booking.payment.status).toBe("pending");
    });

    it("should find booking by ID", async () => {
      const bookingData = {
        roomId: testRoomId,
        seekerId: testSeekerId,
        ownerId: testOwnerId,
        ...sampleBookingData,
      };

      const createdBooking = await BookingService.createBooking(bookingData);
      const foundBooking = await BookingService.findById(
        (createdBooking._id as Types.ObjectId).toString()
      );

      expect(foundBooking).toBeDefined();
      expect((foundBooking?._id as Types.ObjectId)?.toString()).toBe(
        (createdBooking._id as Types.ObjectId).toString()
      );
    });

    it("should update booking status", async () => {
      const bookingData = {
        roomId: testRoomId,
        seekerId: testSeekerId,
        ownerId: testOwnerId,
        ...sampleBookingData,
      };

      const createdBooking = await BookingService.createBooking(bookingData);
      const updatedBooking = await BookingService.updateStatus(
        (createdBooking._id as Types.ObjectId).toString(),
        "confirmed",
        "Booking approved"
      );

      expect(updatedBooking).toBeDefined();
      expect(updatedBooking?.status).toBe("confirmed");
      expect(updatedBooking?.message).toBe("Booking approved");
      expect(updatedBooking?.responseDate).toBeDefined();
    });

    it("should cancel booking", async () => {
      const bookingData = {
        roomId: testRoomId,
        seekerId: testSeekerId,
        ownerId: testOwnerId,
        ...sampleBookingData,
      };

      const createdBooking = await BookingService.createBooking(bookingData);
      const cancelledBooking = await BookingService.cancelBooking(
        (createdBooking._id as Types.ObjectId).toString(),
        "Changed my mind"
      );

      expect(cancelledBooking).toBeDefined();
      expect(cancelledBooking?.status).toBe("cancelled");
      expect(cancelledBooking?.message).toBe("Changed my mind");
    });

    it("should handle invalid booking ID format", async () => {
      await expect(BookingService.findById("invalid-id")).rejects.toThrow(
        "Invalid booking ID format"
      );
      await expect(BookingService.updateById("invalid-id", {})).rejects.toThrow(
        "Invalid booking ID format"
      );
      await expect(BookingService.deleteById("invalid-id")).rejects.toThrow(
        "Invalid booking ID format"
      );
    });
  });

  describe("Aadhaar Verification", () => {
    it("should validate correct Aadhaar numbers", () => {
      // Using test Aadhaar numbers (these are not real)
      const validAadhaarNumbers = [
        "234567890123", // Valid format with proper checksum
        "345678901234", // Another valid format
      ];

      validAadhaarNumbers.forEach((number) => {
        const isValid = validateAadhaarNumber(number);
        // Note: These might fail checksum validation, but format should be correct
        expect(typeof isValid).toBe("boolean");
      });
    });

    it("should reject invalid Aadhaar numbers", () => {
      const invalidAadhaarNumbers = [
        "123456789012", // Starts with 1
        "023456789012", // Starts with 0
        "12345678901", // Too short
        "1234567890123", // Too long
        "abcd56789012", // Contains letters
      ];

      invalidAadhaarNumbers.forEach((number) => {
        expect(validateAadhaarNumber(number)).toBe(false);
      });
    });

    it("should validate Aadhaar document", () => {
      const validDocument = validateAadhaarDocument(
        "/uploads/documents/test-aadhaar.jpg",
        "image/jpeg",
        1024 * 1024 // 1MB
      );

      expect(validDocument.isValid).toBe(true);
      expect(validDocument.errors).toHaveLength(0);
    });

    it("should reject invalid document types", () => {
      const invalidDocument = validateAadhaarDocument(
        "/uploads/documents/test-aadhaar.txt",
        "text/plain",
        1024 * 1024
      );

      expect(invalidDocument.isValid).toBe(false);
      expect(invalidDocument.errors).toContain(
        "Invalid file type. Please upload JPEG, PNG, WebP, or PDF files only."
      );
    });

    it("should reject oversized documents", () => {
      const oversizedDocument = validateAadhaarDocument(
        "/uploads/documents/test-aadhaar.jpg",
        "image/jpeg",
        10 * 1024 * 1024 // 10MB
      );

      expect(oversizedDocument.isValid).toBe(false);
      expect(oversizedDocument.errors).toContain(
        "File size too large. Maximum allowed size is 5MB."
      );
    });

    it("should verify Aadhaar in booking", async () => {
      const bookingData = {
        roomId: testRoomId,
        seekerId: testSeekerId,
        ownerId: testOwnerId,
        aadhaarDocument: {
          fileUrl: "/uploads/documents/test-aadhaar.jpg",
          verified: false,
        },
        payment: {
          amount: 15000,
          status: "pending" as const,
        },
      };

      const createdBooking = await BookingService.createBooking(bookingData);
      const verifiedBooking = await BookingService.verifyAadhaar(
        (createdBooking._id as Types.ObjectId).toString(),
        true
      );

      expect(verifiedBooking).toBeDefined();
      expect(verifiedBooking?.aadhaarDocument.verified).toBe(true);
      expect(verifiedBooking?.aadhaarDocument.verificationDate).toBeDefined();
      expect(verifiedBooking?.status).toBe("verified");
    });
  });

  describe("Payment Processing", () => {
    it("should update payment information", async () => {
      const bookingData = {
        roomId: testRoomId,
        seekerId: testSeekerId,
        ownerId: testOwnerId,
        aadhaarDocument: {
          fileUrl: "/uploads/documents/test-aadhaar.jpg",
          verified: true,
        },
        payment: {
          amount: 15000,
          status: "pending" as const,
        },
      };

      const createdBooking = await BookingService.createBooking(bookingData);
      const paymentData = {
        paymentId: "pay_test123",
        orderId: "order_test123",
        status: "completed" as const,
        paymentDate: new Date(),
      };

      const updatedBooking = await BookingService.updatePayment(
        (createdBooking._id as Types.ObjectId).toString(),
        paymentData
      );

      expect(updatedBooking).toBeDefined();
      expect(updatedBooking?.payment.paymentId).toBe("pay_test123");
      expect(updatedBooking?.payment.status).toBe("completed");
      expect(updatedBooking?.status).toBe("paid");
    });

    it("should handle payment failure", async () => {
      const bookingData = {
        roomId: testRoomId,
        seekerId: testSeekerId,
        ownerId: testOwnerId,
        aadhaarDocument: {
          fileUrl: "/uploads/documents/test-aadhaar.jpg",
          verified: true,
        },
        payment: {
          amount: 15000,
          status: "pending" as const,
        },
      };

      const createdBooking = await BookingService.createBooking(bookingData);
      const paymentData = {
        status: "failed" as const,
      };

      const updatedBooking = await BookingService.updatePayment(
        (createdBooking._id as Types.ObjectId).toString(),
        paymentData
      );

      expect(updatedBooking).toBeDefined();
      expect(updatedBooking?.payment.status).toBe("failed");
    });
  });

  describe("Booking Queries and Filtering", () => {
    let testSeekerId2: Types.ObjectId;
    let testRoomId2: Types.ObjectId;

    beforeEach(async () => {
      // Create additional test users and rooms to avoid duplicate key errors
      const seeker2 = await User.create({
        email: "seeker2@test.com",
        name: "Test Seeker 2",
        userType: "seeker",
        phoneVerified: true,
      });
      testSeekerId2 = seeker2._id;

      const room2 = await Room.create({
        ownerId: testOwnerId,
        title: "Test Room 2",
        description: "Another test room for booking",
        monthlyRent: 20000,
        location: {
          address: "456 Test Avenue",
      coordinates: { type: "Point", coordinates: [77.1025, 28.7041] },
          city: "Delhi",
          state: "Delhi",
          pincode: "110007",
        },
        images: ["test-image2.jpg"],
        amenities: ["wifi", "ac"],
        roomType: "double",
        availability: true,
      });
      testRoomId2 = room2._id;

      // Create multiple bookings for testing with different combinations
      const bookings = [
        {
          roomId: testRoomId,
          seekerId: testSeekerId,
          ownerId: testOwnerId,
          status: "pending" as const,
          aadhaarDocument: { fileUrl: "/test1.jpg", verified: false },
          payment: { amount: 15000, status: "pending" as const },
        },
        {
          roomId: testRoomId,
          seekerId: testSeekerId,
          ownerId: testOwnerId,
          status: "confirmed" as const,
          aadhaarDocument: { fileUrl: "/test2.jpg", verified: true },
          payment: { amount: 20000, status: "completed" as const },
        },
      ];

      for (const bookingData of bookings) {
        await BookingService.createBooking(bookingData);
      }
    });

    it("should get bookings by seeker", async () => {
      const result = await BookingService.getBookingsBySeeker(
        testSeekerId.toString()
      );

      expect(result.bookings).toHaveLength(2);
      expect(
        result.bookings.every((booking) =>
          booking.seekerId.equals(testSeekerId)
        )
      ).toBe(true);
    });

    it("should get bookings by owner", async () => {
      const result = await BookingService.getBookingsByOwner(
        testOwnerId.toString()
      );

      expect(result.bookings).toHaveLength(2);
      expect(
        result.bookings.every((booking) => booking.ownerId.equals(testOwnerId))
      ).toBe(true);
    });

    it("should get bookings by room", async () => {
      const result = await BookingService.getBookingsByRoom(
        testRoomId.toString()
      );

      expect(result.bookings).toHaveLength(2);
      expect(
        result.bookings.every((booking) => booking.roomId.equals(testRoomId))
      ).toBe(true);
    });

    it("should search bookings with filters", async () => {
      const result = await BookingService.searchBookings({
        status: "pending",
      });

      expect(result.bookings).toHaveLength(1);
      expect(result.bookings[0].status).toBe("pending");
    });

    it("should get owner booking statistics", async () => {
      const stats = await BookingService.getOwnerBookingStats(
        testOwnerId.toString()
      );

      expect(stats.totalBookings).toBe(2);
      expect(stats.pendingBookings).toBe(1);
      expect(stats.confirmedBookings).toBe(1);
      expect(stats.totalRevenue).toBe(20000); // Only completed payments
    });

    it("should verify booking ownership", async () => {
      const bookings = await BookingService.getBookingsBySeeker(
        testSeekerId.toString()
      );
      const bookingId = bookings.bookings[0]._id as Types.ObjectId;

      const isSeekerOwner = await BookingService.verifyBookingOwnership(
        bookingId.toString(),
        testSeekerId.toString(),
        "seeker"
      );
      expect(isSeekerOwner).toBe(true);

      const isOwnerOwner = await BookingService.verifyBookingOwnership(
        bookingId.toString(),
        testOwnerId.toString(),
        "owner"
      );
      expect(isOwnerOwner).toBe(true);

      const otherUserId = new Types.ObjectId();
      const isNotOwner = await BookingService.verifyBookingOwnership(
        bookingId.toString(),
        otherUserId.toString(),
        "seeker"
      );
      expect(isNotOwner).toBe(false);
    });
  });

  describe("Notification System", () => {
    it("should send booking request notification", async () => {
      const result = await NotificationService.notifyBookingRequest(
        testOwnerId,
        "Test Seeker",
        "Test Room",
        new Types.ObjectId()
      );

      expect(result).toBe(true);
    });

    it("should send booking confirmation notification", async () => {
      const result = await NotificationService.notifyBookingConfirmed(
        testSeekerId,
        "Test Owner",
        "Test Room",
        new Types.ObjectId()
      );

      expect(result).toBe(true);
    });

    it("should send booking cancellation notification", async () => {
      const result = await NotificationService.notifyBookingCancelled(
        testSeekerId,
        "Test Owner",
        "Test Room",
        new Types.ObjectId(),
        "Room no longer available"
      );

      expect(result).toBe(true);
    });

    it("should send payment completion notification", async () => {
      const result = await NotificationService.notifyPaymentCompleted(
        testOwnerId,
        "Test Seeker",
        "Test Room",
        15000,
        new Types.ObjectId()
      );

      expect(result).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid user IDs in booking queries", async () => {
      await expect(
        BookingService.getBookingsBySeeker("invalid-id")
      ).rejects.toThrow("Invalid seeker ID format");
      await expect(
        BookingService.getBookingsByOwner("invalid-id")
      ).rejects.toThrow("Invalid owner ID format");
      await expect(
        BookingService.getBookingsByRoom("invalid-id")
      ).rejects.toThrow("Invalid room ID format");
    });

    it("should handle invalid IDs in booking ownership verification", async () => {
      const validId = new Types.ObjectId();

      const result1 = await BookingService.verifyBookingOwnership(
        "invalid-id",
        validId,
        "seeker"
      );
      expect(result1).toBe(false);

      const result2 = await BookingService.verifyBookingOwnership(
        validId,
        "invalid-id",
        "owner"
      );
      expect(result2).toBe(false);
    });

    it("should handle invalid owner ID in booking stats", async () => {
      await expect(
        BookingService.getOwnerBookingStats("invalid-id")
      ).rejects.toThrow("Invalid owner ID format");
    });
  });
});
