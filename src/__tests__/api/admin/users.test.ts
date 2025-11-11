import { NextRequest } from "next/server";
import { GET, PUT, DELETE } from "@/app/api/admin/users/route";
import { getServerSession } from "next-auth/next";
import { AdminService } from "@/services/adminService";

// Mock dependencies
jest.mock("next-auth/next");
jest.mock("@/services/adminService");

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;
const mockAdminService = AdminService as jest.Mocked<typeof AdminService>;

describe("/api/admin/users", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("should return 401 if user is not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/admin/users");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 if user is not admin", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", userType: "seeker" },
      } as any);

      const request = new NextRequest("http://localhost:3000/api/admin/users");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Admin access required");
    });

    it("should return users for admin user", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", userType: "admin" },
      } as any);

      const mockUsers = {
        users: [{ id: "1", name: "Test User", email: "test@example.com" }],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        filters: {},
      };

      mockAdminService.getUsers.mockResolvedValue(mockUsers);

      const request = new NextRequest("http://localhost:3000/api/admin/users");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockUsers);
    });

    it("should validate query parameters", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", userType: "admin" },
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/users?page=invalid"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Page must be a valid number");
    });
  });

  describe("PUT", () => {
    it("should update user status", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin1", userType: "admin" },
      } as any);

      mockAdminService.getUserById.mockResolvedValue({ id: "user1" } as any);
      mockAdminService.updateUserStatus.mockResolvedValue({
        id: "user1",
        isActive: false,
      } as any);

      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "PUT",
        body: JSON.stringify({ userId: "user1", isActive: false }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("User updated successfully");
    });

    it("should prevent admin from deactivating themselves", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin1", userType: "admin" },
      } as any);

      mockAdminService.getUserById.mockResolvedValue({ id: "admin1" } as any);

      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "PUT",
        body: JSON.stringify({ userId: "admin1", isActive: false }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Cannot deactivate your own account");
    });
  });
});
