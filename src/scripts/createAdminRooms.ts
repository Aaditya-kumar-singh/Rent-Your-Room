import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Room from "@/models/Room";

async function createAdminRooms() {
  try {
    await connectDB();

    // Find the admin user
    const adminUser = await User.findOne({ email: "admin@roomrental.com" });
    if (!adminUser) {
      throw new Error("Admin user not found");
    }

    console.log("Creating rooms for admin user...");

    const adminRooms = [
      {
        ownerId: adminUser._id,
        title: "Luxury 2BHK in Mumbai Central",
        description:
          "Beautiful 2BHK apartment in the heart of Mumbai with modern amenities, fully furnished, and excellent connectivity to business districts.",
        monthlyRent: 45000,
        location: {
          address: "123, Marine Drive, Mumbai Central, Mumbai",
          coordinates: { lat: 19.0176, lng: 72.8562 },
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400020",
        },
        images: [
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
        ],
        amenities: [
          "WiFi",
          "AC",
          "Parking",
          "Furnished",
          "Security",
          "Elevator",
          "Power Backup",
        ],
        roomType: "2bhk",
        availability: true,
        isSampleData: false,
      },
      {
        ownerId: adminUser._id,
        title: "Modern Studio in Bangalore Tech Park",
        description:
          "Contemporary studio apartment near major tech companies in Bangalore. Perfect for working professionals with high-speed internet and modern facilities.",
        monthlyRent: 25000,
        location: {
          address: "456, Whitefield Road, Bangalore",
          coordinates: { lat: 12.9698, lng: 77.75 },
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560066",
        },
        images: [
          "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
        ],
        amenities: [
          "WiFi",
          "AC",
          "Furnished",
          "Kitchen",
          "Laundry",
          "Security",
        ],
        roomType: "studio",
        availability: true,
        isSampleData: false,
      },
      {
        ownerId: adminUser._id,
        title: "Spacious 3BHK in Delhi NCR",
        description:
          "Large 3BHK apartment in Gurgaon with balcony, parking, and all modern amenities. Great for families or sharing with friends.",
        monthlyRent: 35000,
        location: {
          address: "789, Sector 14, Gurgaon, Delhi NCR",
          coordinates: { lat: 28.4595, lng: 77.0266 },
          city: "Gurgaon",
          state: "Haryana",
          pincode: "122001",
        },
        images: [
          "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=600&fit=crop",
        ],
        amenities: [
          "WiFi",
          "Parking",
          "Balcony",
          "Semi-Furnished",
          "Security",
          "Power Backup",
          "Water Supply",
        ],
        roomType: "3bhk",
        availability: true,
        isSampleData: false,
      },
    ];

    const createdRooms = await Room.insertMany(adminRooms);
    console.log(`Created ${createdRooms.length} rooms for admin user`);

    return createdRooms;
  } catch (error) {
    console.error("Error creating admin rooms:", error);
    throw error;
  }
}

export { createAdminRooms };

// If running this file directly
if (require.main === module) {
  createAdminRooms()
    .then((rooms) => {
      console.log("Admin rooms created successfully!");
      console.log(`Total rooms: ${rooms.length}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create admin rooms:", error);
      process.exit(1);
    });
}
