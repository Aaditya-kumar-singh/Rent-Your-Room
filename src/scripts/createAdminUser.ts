import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

async function createAdminUser() {
  try {
    await connectDB();

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: "admin@roomrental.com" });
    if (existingAdmin) {
      console.log("Admin user already exists");
      if (existingAdmin.userType !== "admin") {
        existingAdmin.userType = "admin";
        await existingAdmin.save();
        console.log("Updated existing user to admin");
      }
      return existingAdmin;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 12);

    const adminUser = await User.create({
      email: "admin@roomrental.com",
      name: "Admin User",
      password: hashedPassword,
      userType: "admin",
      phoneVerified: true,
      isSampleData: false,
    });

    console.log("Admin user created successfully!");
    console.log("Email: admin@roomrental.com");
    console.log("Password: admin123");

    return adminUser;
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
}

export { createAdminUser };

// If running this file directly
if (require.main === module) {
  createAdminUser()
    .then((user) => {
      console.log("Admin user setup completed!");
      console.log(`User ID: ${user._id}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create admin user:", error);
      process.exit(1);
    });
}
