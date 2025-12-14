import Room, { IRoom } from "@/models/Room";
import connectDB from "@/lib/mongodb";
import { Types, FilterQuery } from "mongoose";
import { dbOperation } from "@/utils/errorHandler";

export interface RoomSearchFilters {
  minRent?: number;
  maxRent?: number;
  city?: string;
  state?: string;
  roomType?: string;
  amenities?: string[];
  availability?: boolean;
  coordinates?: {
    lat: number;
    lng: number;
    radius?: number; // in kilometers
  };
  searchText?: string;
  includeSampleData?: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  includeSampleData?: boolean;
}

export class RoomService {
  /**
   * Create a new room listing
   */
  static async createRoom(roomData: Partial<IRoom>): Promise<IRoom> {
    return dbOperation(async () => {
      await connectDB();

      // Normalize coordinates: accept {lat, lng} and convert to GeoJSON { type: 'Point', coordinates: [lng, lat] }
      const normalizedData: any = { ...roomData };
      if (
        normalizedData?.location?.coordinates &&
        typeof normalizedData.location.coordinates === "object" &&
        "lat" in normalizedData.location.coordinates &&
        "lng" in normalizedData.location.coordinates
      ) {
        const { lat, lng } = normalizedData.location.coordinates as {
          lat: number;
          lng: number;
        };
        normalizedData.location.coordinates = {
          type: "Point",
          coordinates: [lng, lat],
        };
      }

      const room = new Room(normalizedData);
      return await room.save();
    }, "Failed to create room listing");
  }

  /**
   * Find room by ID
   */
  static async findById(id: string | Types.ObjectId): Promise<IRoom | null> {
    return dbOperation(async () => {
      await connectDB();

      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid room ID format");
      }

      return (await Room.findById(id)
        .populate("ownerId", "name email phone profileImage")
        .select("-__v")
        .lean()) as IRoom | null; // Use lean() for better performance when not modifying
    }, "Failed to find room");
  }

  /**
   * Update room by ID
   */
  static async updateById(
    id: string | Types.ObjectId,
    updateData: Partial<IRoom>
  ): Promise<IRoom | null> {
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid room ID format");
    }

    return await Room.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate("ownerId", "name email phone profileImage")
      .select("-__v");
  }

  /**
   * Delete room by ID
   */
  static async deleteById(id: string | Types.ObjectId): Promise<boolean> {
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid room ID format");
    }

    const result = await Room.findByIdAndDelete(id);
    return !!result;
  }

  /**
   * Get rooms by owner ID
   */
  static async getRoomsByOwner(
    ownerId: string | Types.ObjectId,
    options: PaginationOptions = {}
  ): Promise<{
    rooms: IRoom[];
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
      sortBy = "createdAt",
      sortOrder = "desc",
      includeSampleData = false,
    } = options;
    const skip = (page - 1) * limit;

    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const query: FilterQuery<IRoom> = { ownerId };

    // Filter out sample data unless explicitly requested
    if (!includeSampleData) {
      query.isSampleData = { $ne: true };
    }

    const rooms = await Room.find(query)
      .select("-__v")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Room.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      rooms,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Search rooms with filters
   */
  static async searchRooms(
    filters: RoomSearchFilters = {},
    options: PaginationOptions = {}
  ): Promise<{
    rooms: IRoom[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    await connectDB();

    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;
    const skip = (page - 1) * limit;

    // Build query
    const query: FilterQuery<IRoom> = {};

    // Filter out sample data unless explicitly requested
    if (!filters.includeSampleData) {
      query.isSampleData = { $ne: true };
    }

    // Availability filter (apply only if specified)
    if (filters.availability !== undefined) {
      query.availability = filters.availability;
    }

    // Price range filter
    if (filters.minRent !== undefined || filters.maxRent !== undefined) {
      query.monthlyRent = {};
      if (filters.minRent !== undefined) {
        query.monthlyRent.$gte = filters.minRent;
      }
      if (filters.maxRent !== undefined) {
        query.monthlyRent.$lte = filters.maxRent;
      }
    }

    // Location filters
    if (filters.city) {
      query["location.city"] = new RegExp(filters.city, "i");
    }
    if (filters.state) {
      query["location.state"] = new RegExp(filters.state, "i");
    }

    // Room type filter
    if (filters.roomType) {
      query.roomType = filters.roomType;
    }

    // Amenities filter
    if (filters.amenities && filters.amenities.length > 0) {
      query.amenities = { $in: filters.amenities };
    }

    // Text search
    if (filters.searchText) {
      query.$text = { $search: filters.searchText };
    }

    // Geospatial search
    if (filters.coordinates) {
      const { lat, lng, radius = 10 } = filters.coordinates;
      query["location.coordinates"] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat], // [longitude, latitude]
          },
          $maxDistance: radius * 1000, // Convert km to meters
        },
      };
    }

    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const rooms = await Room.find(query)
      .populate("ownerId", "name email phone profileImage")
      .select("-__v")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean() as unknown as IRoom[];

    const total = await Room.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      rooms,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Get nearby rooms using geospatial query
   */
  static async getNearbyRooms(
    lat: number,
    lng: number,
    radiusKm: number = 10,
    options: PaginationOptions = {}
  ): Promise<IRoom[]> {
    await connectDB();

    const { limit = 10, includeSampleData = false } = options;

    const query: FilterQuery<IRoom> = {
      availability: true,
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat], // [longitude, latitude]
          },
          $maxDistance: radiusKm * 1000, // Convert km to meters
        },
      },
    };

    // Filter out sample data unless explicitly requested
    if (!includeSampleData) {
      query.isSampleData = { $ne: true };
    }

    return await Room.find(query)
      .populate("ownerId", "name email phone profileImage")
      .select("-__v")
      .limit(limit);
  }

  /**
   * Update room availability
   */
  static async updateAvailability(
    id: string | Types.ObjectId,
    availability: boolean
  ): Promise<IRoom | null> {
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid room ID format");
    }

    return await Room.findByIdAndUpdate(
      id,
      { availability, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate("ownerId", "name email phone profileImage")
      .select("-__v");
  }

  /**
   * Get room statistics for owner
   */
  static async getOwnerStats(ownerId: string | Types.ObjectId): Promise<{
    totalRooms: number;
    availableRooms: number;
    bookedRooms: number;
    averageRent: number;
  }> {
    await connectDB();

    if (!Types.ObjectId.isValid(ownerId)) {
      throw new Error("Invalid owner ID format");
    }

    const stats = await Room.aggregate([
      { $match: { ownerId: new Types.ObjectId(ownerId.toString()) } },
      {
        $group: {
          _id: null,
          totalRooms: { $sum: 1 },
          availableRooms: {
            $sum: { $cond: [{ $eq: ["$availability", true] }, 1, 0] },
          },
          bookedRooms: {
            $sum: { $cond: [{ $eq: ["$availability", false] }, 1, 0] },
          },
          averageRent: { $avg: "$monthlyRent" },
        },
      },
    ]);

    return (
      stats[0] || {
        totalRooms: 0,
        availableRooms: 0,
        bookedRooms: 0,
        averageRent: 0,
      }
    );
  }

  /**
   * Check if room exists and belongs to owner
   */
  static async verifyOwnership(
    roomId: string | Types.ObjectId,
    ownerId: string | Types.ObjectId
  ): Promise<boolean> {
    await connectDB();

    if (!Types.ObjectId.isValid(roomId) || !Types.ObjectId.isValid(ownerId)) {
      return false;
    }

    const room = await Room.findOne({
      _id: roomId,
      ownerId: ownerId,
    }).select("_id");

    return !!room;
  }
}
