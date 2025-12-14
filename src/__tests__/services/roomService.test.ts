import { RoomService } from "@/services/roomService";
import { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import User from "@/models/User";

describe("RoomService", () => {
  let mongoServer: MongoMemoryServer;
  let testOwnerId: Types.ObjectId;

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

    // Create a test user to be the owner
    const testUser = await User.create({
      email: "owner@test.com",
      name: "Test Owner",
      userType: "owner",
      phoneVerified: true,
    });
    testOwnerId = testUser._id;
  });

  describe("Room CRUD Operations", () => {
    const sampleRoomData = {
      title: "Cozy Single Room",
      description: "A comfortable single room with all amenities",
      monthlyRent: 15000,
      location: {
        address: "123 Test Street, Test Area",
        coordinates: {
          lat: 28.6139,
          lng: 77.209,
        },
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
      },
      images: ["image1.jpg", "image2.jpg"],
      amenities: ["wifi", "ac", "parking"],
      roomType: "single",
      availability: true,
    };

    it("should create a room successfully", async () => {
      const roomData = {
        ...sampleRoomData,
        ownerId: testOwnerId,
      };

      const room = await RoomService.createRoom(roomData);

      expect(room).toBeDefined();
      expect(room.title).toBe(roomData.title);
      expect(room.ownerId).toEqual(testOwnerId);
      expect(room.monthlyRent).toBe(roomData.monthlyRent);
      expect(room.availability).toBe(true);
      expect(room.location.city).toBe("Delhi");
    });

    it("should find room by ID", async () => {
      const roomData = {
        ...sampleRoomData,
        ownerId: testOwnerId,
      };

      const createdRoom = await RoomService.createRoom(roomData);
      const foundRoom = await RoomService.findById(
        (createdRoom._id as Types.ObjectId).toString()
      );

      expect(foundRoom).toBeDefined();
      expect(foundRoom?._id).toEqual(createdRoom._id);
      expect(foundRoom?.title).toBe(roomData.title);
    });

    it("should update room by ID", async () => {
      const roomData = {
        ...sampleRoomData,
        ownerId: testOwnerId,
      };

      const createdRoom = await RoomService.createRoom(roomData);
      const updateData = {
        title: "Updated Room Title",
        monthlyRent: 18000,
      };

      const updatedRoom = await RoomService.updateById(
        (createdRoom._id as Types.ObjectId).toString(),
        updateData
      );

      expect(updatedRoom).toBeDefined();
      expect(updatedRoom?.title).toBe("Updated Room Title");
      expect(updatedRoom?.monthlyRent).toBe(18000);
    });

    it("should delete room by ID", async () => {
      const roomData = {
        ...sampleRoomData,
        ownerId: testOwnerId,
      };

      const createdRoom = await RoomService.createRoom(roomData);
      const deleted = await RoomService.deleteById(
        (createdRoom._id as Types.ObjectId).toString()
      );

      expect(deleted).toBe(true);

      const foundRoom = await RoomService.findById(
        (createdRoom._id as Types.ObjectId).toString()
      );
      expect(foundRoom).toBeNull();
    });

    it("should handle invalid room ID format", async () => {
      await expect(RoomService.findById("invalid-id")).rejects.toThrow(
        "Invalid room ID format"
      );
      await expect(RoomService.updateById("invalid-id", {})).rejects.toThrow(
        "Invalid room ID format"
      );
      await expect(RoomService.deleteById("invalid-id")).rejects.toThrow(
        "Invalid room ID format"
      );
    });
  });

  describe("Room Search and Filtering", () => {
    beforeEach(async () => {
      // Create multiple test rooms with different properties
      const rooms = [
        {
          ownerId: testOwnerId,
          title: "Budget Single Room",
          description: "Affordable single room",
          monthlyRent: 10000,
          location: {
            address: "123 Budget Street",
            coordinates: { lat: 28.6139, lng: 77.209 },
            city: "Delhi",
            state: "Delhi",
            pincode: "110001",
          },
          images: ["image1.jpg"],
          amenities: ["wifi"],
          roomType: "single",
          availability: true,
        },
        {
          ownerId: testOwnerId,
          title: "Luxury Double Room",
          description: "Premium double room with AC",
          monthlyRent: 25000,
          location: {
            address: "456 Luxury Avenue",
            coordinates: { lat: 28.7041, lng: 77.1025 },
            city: "Delhi",
            state: "Delhi",
            pincode: "110007",
          },
          images: ["image2.jpg"],
          amenities: ["wifi", "ac", "parking"],
          roomType: "double",
          availability: true,
        },
        {
          ownerId: testOwnerId,
          title: "Mumbai Studio",
          description: "Modern studio apartment",
          monthlyRent: 30000,
          location: {
            address: "789 Studio Complex",
            coordinates: { lat: 19.076, lng: 72.8777 },
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001",
          },
          images: ["image3.jpg"],
          amenities: ["wifi", "ac", "gym"],
          roomType: "studio",
          availability: false,
        },
      ];

      for (const roomData of rooms) {
        await RoomService.createRoom(roomData);
      }
    });

    it("should search rooms with price range filter", async () => {
      const result = await RoomService.searchRooms({
        minRent: 15000,
        maxRent: 30000,
      });

      expect(result.rooms).toHaveLength(2);
      expect(
        result.rooms.every(
          (room) => room.monthlyRent >= 15000 && room.monthlyRent <= 30000
        )
      ).toBe(true);
    });

    it("should search rooms by city", async () => {
      const result = await RoomService.searchRooms({
        city: "Delhi",
      });

      expect(result.rooms).toHaveLength(2);
      expect(result.rooms.every((room) => room.location.city === "Delhi")).toBe(
        true
      );
    });

    it("should search rooms by room type", async () => {
      const result = await RoomService.searchRooms({
        roomType: "single",
      });

      expect(result.rooms).toHaveLength(1);
      expect(result.rooms[0].roomType).toBe("single");
    });

    it("should search rooms by amenities", async () => {
      const result = await RoomService.searchRooms({
        amenities: ["ac"],
      });

      expect(result.rooms).toHaveLength(2);
      expect(result.rooms.every((room) => room.amenities.includes("ac"))).toBe(
        true
      );
    });

    it("should filter by availability", async () => {
      const availableResult = await RoomService.searchRooms({
        availability: true,
      });

      const unavailableResult = await RoomService.searchRooms({
        availability: false,
      });

      expect(availableResult.rooms).toHaveLength(2);
      expect(unavailableResult.rooms).toHaveLength(1);
      expect(unavailableResult.rooms[0].availability).toBe(false);
    });

    it("should handle pagination", async () => {
      const result = await RoomService.searchRooms(
        {},
        {
          page: 1,
          limit: 2,
        }
      );

      expect(result.rooms).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.total).toBe(3);
      expect(result.totalPages).toBe(2);
    });

    it("should handle sorting", async () => {
      const result = await RoomService.searchRooms(
        {},
        {
          sortBy: "monthlyRent",
          sortOrder: "asc",
        }
      );

      expect(result.rooms).toHaveLength(3);
      expect(result.rooms[0].monthlyRent).toBeLessThanOrEqual(
        result.rooms[1].monthlyRent
      );
    });
  });

  describe("Geospatial Queries", () => {
    beforeEach(async () => {
      // Create rooms at different locations
      const rooms = [
        {
          ownerId: testOwnerId,
          title: "Central Delhi Room",
          description: "Room in central Delhi",
          monthlyRent: 20000,
          location: {
            address: "Central Delhi",
            coordinates: { lat: 28.6139, lng: 77.209 }, // New Delhi coordinates
            city: "Delhi",
            state: "Delhi",
            pincode: "110001",
          },
          images: ["image1.jpg"],
          amenities: ["wifi"],
          roomType: "single",
          availability: true,
        },
        {
          ownerId: testOwnerId,
          title: "Far Delhi Room",
          description: "Room far from center",
          monthlyRent: 15000,
          location: {
            address: "Far Delhi",
            coordinates: { lat: 28.7041, lng: 77.1025 }, // Different area in Delhi
            city: "Delhi",
            state: "Delhi",
            pincode: "110007",
          },
          images: ["image2.jpg"],
          amenities: ["wifi"],
          roomType: "single",
          availability: true,
        },
      ];

      for (const roomData of rooms) {
        await RoomService.createRoom(roomData);
      }

      // Wait a bit for the geospatial index to be ready
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it("should find nearby rooms", async () => {
      const nearbyRooms = await RoomService.getNearbyRooms(
        28.6139, // Central Delhi lat
        77.209, // Central Delhi lng
        20 // 20km radius
      );

      expect(nearbyRooms).toHaveLength(2);
    });

    it("should find rooms within smaller radius", async () => {
      const nearbyRooms = await RoomService.getNearbyRooms(
        28.6139, // Central Delhi lat
        77.209, // Central Delhi lng
        5 // 5km radius
      );

      expect(nearbyRooms.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Owner-specific Operations", () => {
    beforeEach(async () => {
      // Create multiple rooms for the test owner
      const rooms = [
        {
          ownerId: testOwnerId,
          title: "Owner Room 1",
          description: "First room",
          monthlyRent: 15000,
          location: {
            address: "Test Address 1",
            coordinates: { lat: 28.6139, lng: 77.209 },
            city: "Delhi",
            state: "Delhi",
            pincode: "110001",
          },
          images: ["image1.jpg"],
          amenities: ["wifi"],
          roomType: "single",
          availability: true,
        },
        {
          ownerId: testOwnerId,
          title: "Owner Room 2",
          description: "Second room",
          monthlyRent: 20000,
          location: {
            address: "Test Address 2",
            coordinates: { lat: 28.6139, lng: 77.209 },
            city: "Delhi",
            state: "Delhi",
            pincode: "110001",
          },
          images: ["image2.jpg"],
          amenities: ["wifi", "ac"],
          roomType: "double",
          availability: false,
        },
      ];

      for (const roomData of rooms) {
        await RoomService.createRoom(roomData);
      }
    });

    it("should get rooms by owner", async () => {
      const result = await RoomService.getRoomsByOwner(testOwnerId.toString());

      expect(result.rooms).toHaveLength(2);
      expect(
        result.rooms.every((room) => room.ownerId.equals(testOwnerId))
      ).toBe(true);
    });

    it("should get owner statistics", async () => {
      const stats = await RoomService.getOwnerStats(testOwnerId.toString());

      expect(stats.totalRooms).toBe(2);
      expect(stats.availableRooms).toBe(1);
      expect(stats.bookedRooms).toBe(1);
      expect(stats.averageRent).toBe(17500); // (15000 + 20000) / 2
    });

    it("should verify room ownership", async () => {
      const rooms = await RoomService.getRoomsByOwner(testOwnerId.toString());
      const roomId = rooms.rooms[0]._id as Types.ObjectId;

      const isOwner = await RoomService.verifyOwnership(
        roomId.toString(),
        testOwnerId.toString()
      );
      expect(isOwner).toBe(true);

      const otherUserId = new Types.ObjectId();
      const isNotOwner = await RoomService.verifyOwnership(
        roomId.toString(),
        otherUserId.toString()
      );
      expect(isNotOwner).toBe(false);
    });

    it("should update room availability", async () => {
      const rooms = await RoomService.getRoomsByOwner(testOwnerId.toString());
      const availableRoom = rooms.rooms.find(
        (room) => room.availability === true
      );

      if (availableRoom) {
        const updatedRoom = await RoomService.updateAvailability(
          (availableRoom._id as Types.ObjectId).toString(),
          false
        );

        expect(updatedRoom).toBeDefined();
        expect(updatedRoom?.availability).toBe(false);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid owner ID in getRoomsByOwner", async () => {
      await expect(RoomService.getRoomsByOwner("invalid-id")).rejects.toThrow(
        "Invalid owner ID format"
      );
    });

    it("should handle invalid owner ID in getOwnerStats", async () => {
      await expect(RoomService.getOwnerStats("invalid-id")).rejects.toThrow(
        "Invalid owner ID format"
      );
    });

    it("should handle invalid IDs in verifyOwnership", async () => {
      const validId = new Types.ObjectId();

      const result1 = await RoomService.verifyOwnership("invalid-id", validId);
      expect(result1).toBe(false);

      const result2 = await RoomService.verifyOwnership(validId, "invalid-id");
      expect(result2).toBe(false);
    });
  });
});
