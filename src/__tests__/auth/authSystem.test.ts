import { UserService } from "@/services/userService";
import {
  generateOTP,
  validatePhoneNumber,
  formatPhoneNumber,
} from "@/utils/otp";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Types } from "mongoose";
import OTP from "@/models/OTP";

describe("Authentication System", () => {
  let mongoServer: MongoMemoryServer;

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
  });

  describe("Google OAuth Integration", () => {
    it("should create a new user with Google data", async () => {
      const userData = {
        email: "test@gmail.com",
        name: "Test User",
        googleId: "google123",
        profileImage: "https://example.com/image.jpg",
        userType: "seeker" as const,
        phoneVerified: false,
      };

      const user = await UserService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.googleId).toBe(userData.googleId);
      expect(user.userType).toBe("seeker");
      expect(user.phoneVerified).toBe(false);
    });

    it("should find user by Google ID", async () => {
      const userData = {
        email: "test@gmail.com",
        name: "Test User",
        googleId: "google123",
        userType: "seeker" as const,
      };

      await UserService.createUser(userData);
      const foundUser = await UserService.findByGoogleId("google123");

      expect(foundUser).toBeDefined();
      expect(foundUser?.googleId).toBe("google123");
      expect(foundUser?.email).toBe("test@gmail.com");
    });

    it("should find user by email", async () => {
      const userData = {
        email: "test@gmail.com",
        name: "Test User",
        userType: "seeker" as const,
      };

      await UserService.createUser(userData);
      const foundUser = await UserService.findByEmail("test@gmail.com");

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe("test@gmail.com");
    });
  });

  describe("Phone Verification System", () => {
    describe("Phone Number Validation", () => {
      it("should validate correct Indian mobile numbers", () => {
        const validNumbers = [
          "+919876543210",
          "919876543210",
          "9876543210",
          "+91 9876543210",
          "91-9876-543-210",
        ];

        validNumbers.forEach((number) => {
          expect(validatePhoneNumber(number)).toBe(true);
        });
      });

      it("should reject invalid phone numbers", () => {
        const invalidNumbers = [
          "1234567890", // doesn't start with 6-9
          "98765432", // too short
          "98765432101", // too long
          "+1234567890", // wrong country code
          "abcd123456", // contains letters
        ];

        invalidNumbers.forEach((number) => {
          expect(validatePhoneNumber(number)).toBe(false);
        });
      });
    });

    describe("Phone Number Formatting", () => {
      it("should format phone numbers correctly", () => {
        expect(formatPhoneNumber("9876543210")).toBe("+919876543210");
        expect(formatPhoneNumber("919876543210")).toBe("+919876543210");
        expect(formatPhoneNumber("+919876543210")).toBe("+919876543210");
        expect(formatPhoneNumber("91-9876-543-210")).toBe("+919876543210");
      });
    });

    describe("OTP Generation", () => {
      it("should generate 6-digit OTP", () => {
        const otp = generateOTP();

        expect(otp).toHaveLength(6);
        expect(/^\d{6}$/.test(otp)).toBe(true);
        expect(parseInt(otp)).toBeGreaterThanOrEqual(100000);
        expect(parseInt(otp)).toBeLessThanOrEqual(999999);
      });

      it("should generate different OTPs", () => {
        const otp1 = generateOTP();
        const otp2 = generateOTP();

        // While theoretically possible to be the same, it's extremely unlikely
        expect(otp1).not.toBe(otp2);
      });
    });

    describe("Phone Verification Process", () => {
      it("should verify phone number successfully", async () => {
        const userData = {
          email: "test@gmail.com",
          name: "Test User",
          userType: "seeker" as const,
          phoneVerified: false,
        };

        const user = await UserService.createUser(userData);
        const phone = "+919876543210";

        const updatedUser = await UserService.verifyPhone(
          (user._id as Types.ObjectId).toString(),
          phone
        );

        expect(updatedUser).toBeDefined();
        expect(updatedUser?.phone).toBe(phone);
        expect(updatedUser?.phoneVerified).toBe(true);
      });

      it("should create OTP record correctly", async () => {
        const phone = "+919876543210";
        const otp = "123456";
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        const otpRecord = await OTP.create({
          phone,
          otp,
          expiresAt,
          verified: false,
          attempts: 0,
        });

        expect(otpRecord).toBeDefined();
        expect(otpRecord.phone).toBe(phone);
        expect(otpRecord.otp).toBe(otp);
        expect(otpRecord.verified).toBe(false);
        expect(otpRecord.attempts).toBe(0);
      });

      it("should handle OTP verification attempts", async () => {
        const phone = "+919876543210";
        const correctOtp = "123456";
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        const otpRecord = await OTP.create({
          phone,
          otp: correctOtp,
          expiresAt,
          verified: false,
          attempts: 0,
        });

        // Simulate failed attempt
        otpRecord.attempts += 1;
        await otpRecord.save();

        expect(otpRecord.attempts).toBe(1);

        // Simulate successful verification
        otpRecord.verified = true;
        await otpRecord.save();

        expect(otpRecord.verified).toBe(true);
      });
    });
  });

  describe("Session Management", () => {
    it("should update user type successfully", async () => {
      const userData = {
        email: "test@gmail.com",
        name: "Test User",
        userType: "seeker" as const,
      };

      const user = await UserService.createUser(userData);
      const updatedUser = await UserService.updateUserType(
        (user._id as Types.ObjectId).toString(),
        "owner"
      );

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.userType).toBe("owner");
    });

    it("should check if user exists by email", async () => {
      const userData = {
        email: "test@gmail.com",
        name: "Test User",
        userType: "seeker" as const,
      };

      await UserService.createUser(userData);

      const exists = await UserService.existsByEmail("test@gmail.com");
      const notExists = await UserService.existsByEmail(
        "nonexistent@gmail.com"
      );

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });

    it("should check if user exists by phone", async () => {
      const phone = "+919876543210";
      const userData = {
        email: "test@gmail.com",
        name: "Test User",
        phone,
        phoneVerified: true,
        userType: "seeker" as const,
      };

      await UserService.createUser(userData);

      const exists = await UserService.existsByPhone(phone);
      const notExists = await UserService.existsByPhone("+919999999999");

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });
  });

  describe("User Management", () => {
    it("should update user by ID", async () => {
      const userData = {
        email: "test@gmail.com",
        name: "Test User",
        userType: "seeker" as const,
      };

      const user = await UserService.createUser(userData);
      const updateData = { name: "Updated Name" };

      const updatedUser = await UserService.updateById(
        (user._id as Types.ObjectId).toString(),
        updateData
      );

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.name).toBe("Updated Name");
    });

    it("should delete user by ID", async () => {
      const userData = {
        email: "test@gmail.com",
        name: "Test User",
        userType: "seeker" as const,
      };

      const user = await UserService.createUser(userData);
      const deleted = await UserService.deleteById(
        (user._id as Types.ObjectId).toString()
      );

      expect(deleted).toBe(true);

      const foundUser = await UserService.findById(
        (user._id as Types.ObjectId).toString()
      );
      expect(foundUser).toBeNull();
    });

    it("should handle invalid user ID format", async () => {
      await expect(UserService.findById("invalid-id")).rejects.toThrow(
        "Invalid user ID format"
      );
      await expect(UserService.updateById("invalid-id", {})).rejects.toThrow(
        "Invalid user ID format"
      );
      await expect(UserService.deleteById("invalid-id")).rejects.toThrow(
        "Invalid user ID format"
      );
    });
  });
});
