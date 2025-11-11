import User, { IUser } from "@/models/User";
import connectDB from "@/lib/mongodb";
import { Types, FilterQuery } from "mongoose";

export class UserService {
  /**
   * Create a new user
   */
  static async createUser(userData: Partial<IUser>): Promise<IUser> {
    await connectDB();

    const user = new User(userData);
    return await user.save();
  }

  /**
   * Find user by ID
   */
  static async findById(id: string | Types.ObjectId): Promise<IUser | null> {
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid user ID format");
    }

    return await User.findById(id).select("-__v");
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<IUser | null> {
    await connectDB();

    return await User.findOne({ email: email.toLowerCase() }).select("-__v");
  }

  /**
   * Find user by Google ID
   */
  static async findByGoogleId(googleId: string): Promise<IUser | null> {
    await connectDB();

    return await User.findOne({ googleId }).select("-__v");
  }

  /**
   * Find user by phone number
   */
  static async findByPhone(phone: string): Promise<IUser | null> {
    await connectDB();

    return await User.findOne({ phone }).select("-__v");
  }

  /**
   * Update user by ID
   */
  static async updateById(
    id: string | Types.ObjectId,
    updateData: Partial<IUser>
  ): Promise<IUser | null> {
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid user ID format");
    }

    return await User.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select("-__v");
  }

  /**
   * Update user by email
   */
  static async updateByEmail(
    email: string,
    updateData: Partial<IUser>
  ): Promise<IUser | null> {
    await connectDB();

    return await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select("-__v");
  }

  /**
   * Delete user by ID
   */
  static async deleteById(id: string | Types.ObjectId): Promise<boolean> {
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid user ID format");
    }

    const result = await User.findByIdAndDelete(id);
    return !!result;
  }

  /**
   * Verify user's phone number
   */
  static async verifyPhone(
    id: string | Types.ObjectId,
    phone: string
  ): Promise<IUser | null> {
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid user ID format");
    }

    return await User.findByIdAndUpdate(
      id,
      {
        phone,
        phoneVerified: true,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).select("-__v");
  }

  /**
   * Update user type
   */
  static async updateUserType(
    id: string | Types.ObjectId,
    userType: "owner" | "seeker" | "both"
  ): Promise<IUser | null> {
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid user ID format");
    }

    return await User.findByIdAndUpdate(
      id,
      { userType, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select("-__v");
  }

  /**
   * Get all users with pagination
   */
  static async getAllUsers(
    page: number = 1,
    limit: number = 10,
    filter: FilterQuery<IUser> = {}
  ): Promise<{
    users: IUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    await connectDB();

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Check if user exists by email
   */
  static async existsByEmail(email: string): Promise<boolean> {
    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "_id"
    );
    return !!user;
  }

  /**
   * Check if user exists by phone
   */
  static async existsByPhone(phone: string): Promise<boolean> {
    await connectDB();

    const user = await User.findOne({ phone }).select("_id");
    return !!user;
  }
}
