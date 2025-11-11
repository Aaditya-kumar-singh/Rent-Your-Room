import User from "@/models/User";
import connectDB from "@/lib/mongodb";

export interface UserFilters {
  search?: string;
  userType?: "owner" | "seeker" | "both" | "admin";
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface UserDocument {
  _id: string;
  name: string;
  email: string;
  userType: "owner" | "seeker" | "both" | "admin";
  phoneVerified: boolean;
  phone?: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
}

export interface UserListResponse {
  users: UserDocument[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: UserFilters;
}

export class AdminService {
  static async getUsers(
    filters: UserFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<UserListResponse> {
    await connectDB();

    const { page, limit } = pagination;
    const { search, userType } = filters;
    const skip = (page - 1) * limit;

    // Build query with filters
    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (userType && ["owner", "seeker", "both", "admin"].includes(userType)) {
      query.userType = userType;
    }

    // Execute queries in parallel
    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -__v -googleId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      users: users as unknown as UserDocument[],
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        search: search || undefined,
        userType: userType || undefined,
      },
    };
  }

  static async getUserById(userId: string) {
    await connectDB();
    return User.findById(userId).select("-password -__v").lean();
  }

  static async updateUserStatus(userId: string, isActive: boolean) {
    await connectDB();
    return User.findByIdAndUpdate(userId, { isActive }, { new: true }).select(
      "-password -__v"
    );
  }

  static async deleteUser(userId: string) {
    await connectDB();
    return User.findByIdAndDelete(userId);
  }
}
