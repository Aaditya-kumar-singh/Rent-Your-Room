import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Room from "@/models/Room";
import bcrypt from "bcryptjs";

// Comprehensive list of Indian cities with coordinates
const cities = [
  // Major Metro Cities
  { name: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.8777 },
  { name: "Delhi", state: "Delhi", lat: 28.7041, lng: 77.1025 },
  { name: "Bangalore", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { name: "Hyderabad", state: "Telangana", lat: 17.385, lng: 78.4867 },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
  { name: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639 },
  { name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  { name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714 },

  // Tier 1 Cities
  { name: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873 },
  { name: "Surat", state: "Gujarat", lat: 21.1702, lng: 72.8311 },
  { name: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462 },
  { name: "Kanpur", state: "Uttar Pradesh", lat: 26.4499, lng: 80.3319 },
  { name: "Nagpur", state: "Maharashtra", lat: 21.1458, lng: 79.0882 },
  { name: "Indore", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577 },
  { name: "Thane", state: "Maharashtra", lat: 19.2183, lng: 72.9781 },
  { name: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lng: 77.4126 },
  {
    name: "Visakhapatnam",
    state: "Andhra Pradesh",
    lat: 17.6868,
    lng: 83.2185,
  },
  {
    name: "Pimpri-Chinchwad",
    state: "Maharashtra",
    lat: 18.6298,
    lng: 73.7997,
  },
  { name: "Patna", state: "Bihar", lat: 25.5941, lng: 85.1376 },
  { name: "Vadodara", state: "Gujarat", lat: 22.3072, lng: 73.1812 },

  // Tier 2 Cities
  { name: "Agra", state: "Uttar Pradesh", lat: 27.1767, lng: 78.0081 },
  { name: "Nashik", state: "Maharashtra", lat: 19.9975, lng: 73.7898 },
  { name: "Faridabad", state: "Haryana", lat: 28.4089, lng: 77.3178 },
  { name: "Meerut", state: "Uttar Pradesh", lat: 28.9845, lng: 77.7064 },
  { name: "Rajkot", state: "Gujarat", lat: 22.3039, lng: 70.8022 },
  { name: "Kalyan-Dombivli", state: "Maharashtra", lat: 19.2403, lng: 73.1305 },
  { name: "Vasai-Virar", state: "Maharashtra", lat: 19.4912, lng: 72.8054 },
  { name: "Varanasi", state: "Uttar Pradesh", lat: 25.3176, lng: 82.9739 },
  { name: "Srinagar", state: "Jammu and Kashmir", lat: 34.0837, lng: 74.7973 },
  { name: "Aurangabad", state: "Maharashtra", lat: 19.8762, lng: 75.3433 },
  { name: "Dhanbad", state: "Jharkhand", lat: 23.7957, lng: 86.4304 },
  { name: "Amritsar", state: "Punjab", lat: 31.634, lng: 74.8723 },
  { name: "Navi Mumbai", state: "Maharashtra", lat: 19.033, lng: 73.0297 },
  { name: "Allahabad", state: "Uttar Pradesh", lat: 25.4358, lng: 81.8463 },
  { name: "Ranchi", state: "Jharkhand", lat: 23.3441, lng: 85.3096 },
  { name: "Howrah", state: "West Bengal", lat: 22.5958, lng: 88.2636 },
  { name: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558 },
  { name: "Jabalpur", state: "Madhya Pradesh", lat: 23.1815, lng: 79.9864 },
  { name: "Gwalior", state: "Madhya Pradesh", lat: 26.2183, lng: 78.1828 },
  { name: "Vijayawada", state: "Andhra Pradesh", lat: 16.5062, lng: 80.648 },
  { name: "Jodhpur", state: "Rajasthan", lat: 26.2389, lng: 73.0243 },
  { name: "Madurai", state: "Tamil Nadu", lat: 9.9252, lng: 78.1198 },
  { name: "Raipur", state: "Chhattisgarh", lat: 21.2514, lng: 81.6296 },
  { name: "Kota", state: "Rajasthan", lat: 25.2138, lng: 75.8648 },
  { name: "Chandigarh", state: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  { name: "Guwahati", state: "Assam", lat: 26.1445, lng: 91.7362 },
  { name: "Solapur", state: "Maharashtra", lat: 17.6599, lng: 75.9064 },
  { name: "Hubli-Dharwad", state: "Karnataka", lat: 15.3647, lng: 75.124 },
  { name: "Bareilly", state: "Uttar Pradesh", lat: 28.367, lng: 79.4304 },
  { name: "Moradabad", state: "Uttar Pradesh", lat: 28.8386, lng: 78.7733 },
  { name: "Mysore", state: "Karnataka", lat: 12.2958, lng: 76.6394 },
  { name: "Gurgaon", state: "Haryana", lat: 28.4595, lng: 77.0266 },
  { name: "Aligarh", state: "Uttar Pradesh", lat: 27.8974, lng: 78.088 },
  { name: "Jalandhar", state: "Punjab", lat: 31.326, lng: 75.5762 },
  { name: "Tiruchirappalli", state: "Tamil Nadu", lat: 10.7905, lng: 78.7047 },
  { name: "Bhubaneswar", state: "Odisha", lat: 20.2961, lng: 85.8245 },
  { name: "Salem", state: "Tamil Nadu", lat: 11.6643, lng: 78.146 },
  { name: "Warangal", state: "Telangana", lat: 17.9689, lng: 79.5941 },
  { name: "Mira-Bhayandar", state: "Maharashtra", lat: 19.2952, lng: 72.8544 },
  { name: "Thiruvananthapuram", state: "Kerala", lat: 8.5241, lng: 76.9366 },
  { name: "Bhiwandi", state: "Maharashtra", lat: 19.3002, lng: 73.0635 },
  { name: "Saharanpur", state: "Uttar Pradesh", lat: 29.968, lng: 77.5552 },
  { name: "Guntur", state: "Andhra Pradesh", lat: 16.3067, lng: 80.4365 },
  { name: "Amravati", state: "Maharashtra", lat: 20.9374, lng: 77.7796 },
  { name: "Bikaner", state: "Rajasthan", lat: 28.0229, lng: 73.3119 },
  { name: "Noida", state: "Uttar Pradesh", lat: 28.5355, lng: 77.391 },
  { name: "Jamshedpur", state: "Jharkhand", lat: 22.8046, lng: 86.2029 },
  { name: "Bhilai Nagar", state: "Chhattisgarh", lat: 21.1938, lng: 81.3509 },
  { name: "Cuttack", state: "Odisha", lat: 20.4625, lng: 85.8828 },
  { name: "Firozabad", state: "Uttar Pradesh", lat: 27.1592, lng: 78.3957 },
  { name: "Kochi", state: "Kerala", lat: 9.9312, lng: 76.2673 },
  { name: "Bhavnagar", state: "Gujarat", lat: 21.7645, lng: 72.1519 },
  { name: "Dehradun", state: "Uttarakhand", lat: 30.3165, lng: 78.0322 },
  { name: "Durgapur", state: "West Bengal", lat: 23.5204, lng: 87.3119 },
  { name: "Asansol", state: "West Bengal", lat: 23.6739, lng: 86.9524 },
  { name: "Nanded", state: "Maharashtra", lat: 19.1383, lng: 77.321 },
  { name: "Kolhapur", state: "Maharashtra", lat: 16.705, lng: 74.2433 },
  { name: "Ajmer", state: "Rajasthan", lat: 26.4499, lng: 74.6399 },
  { name: "Akola", state: "Maharashtra", lat: 20.7002, lng: 77.0082 },
  { name: "Gulbarga", state: "Karnataka", lat: 17.3297, lng: 76.8343 },
  { name: "Jamnagar", state: "Gujarat", lat: 22.4707, lng: 70.0577 },
  { name: "Ujjain", state: "Madhya Pradesh", lat: 23.1765, lng: 75.7885 },
  { name: "Loni", state: "Uttar Pradesh", lat: 28.7333, lng: 77.2833 },
  { name: "Siliguri", state: "West Bengal", lat: 26.7271, lng: 88.3953 },
  { name: "Jhansi", state: "Uttar Pradesh", lat: 25.4484, lng: 78.5685 },
  { name: "Ulhasnagar", state: "Maharashtra", lat: 19.2215, lng: 73.1645 },
  { name: "Jammu", state: "Jammu and Kashmir", lat: 32.7266, lng: 74.857 },
  {
    name: "Sangli-Miraj & Kupwad",
    state: "Maharashtra",
    lat: 16.8524,
    lng: 74.5815,
  },
  { name: "Mangalore", state: "Karnataka", lat: 12.9141, lng: 74.856 },
  { name: "Erode", state: "Tamil Nadu", lat: 11.341, lng: 77.7172 },
  { name: "Belgaum", state: "Karnataka", lat: 15.8497, lng: 74.4977 },
  { name: "Ambattur", state: "Tamil Nadu", lat: 13.1143, lng: 80.1548 },
  { name: "Tirunelveli", state: "Tamil Nadu", lat: 8.7139, lng: 77.7567 },
  { name: "Malegaon", state: "Maharashtra", lat: 20.5579, lng: 74.5287 },
  { name: "Gaya", state: "Bihar", lat: 24.7914, lng: 85.0002 },
  { name: "Jalgaon", state: "Maharashtra", lat: 21.0077, lng: 75.5626 },
  { name: "Udaipur", state: "Rajasthan", lat: 24.5854, lng: 73.7125 },
  { name: "Maheshtala", state: "West Bengal", lat: 22.5093, lng: 88.2482 },
];

const roomTypes = [
  "single",
  "double",
  "shared",
  "studio",
  "1bhk",
  "2bhk",
  "3bhk",
  "pg",
  "hostel",
];

const amenities = [
  "WiFi",
  "AC",
  "Parking",
  "Laundry",
  "Kitchen",
  "Balcony",
  "Gym",
  "Swimming Pool",
  "Security",
  "Power Backup",
  "Water Supply",
  "Furnished",
  "Semi-Furnished",
  "Elevator",
  "Garden",
  "Terrace",
  "CCTV",
  "Intercom",
  "Maintenance",
];

const sampleNames = [
  "Rajesh Kumar",
  "Priya Sharma",
  "Amit Singh",
  "Sneha Patel",
  "Vikram Gupta",
  "Anita Reddy",
  "Suresh Nair",
  "Kavya Iyer",
  "Rohit Joshi",
  "Meera Agarwal",
  "Arjun Mehta",
  "Pooja Verma",
  "Kiran Rao",
  "Deepika Sinha",
  "Manoj Tiwari",
  "Ritu Bansal",
  "Sanjay Mishra",
  "Neha Kapoor",
  "Ashok Pandey",
  "Sunita Jain",
  "Rahul Saxena",
  "Shweta Dubey",
  "Vinod Chandra",
  "Rekha Bhatt",
  "Naveen Kumar",
];

const profileImages = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&h=150",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&h=150",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&h=150",
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=150&h=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150",
];

const roomImages = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=600&fit=crop",
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateRandomCoordinates(baseCity: (typeof cities)[0]) {
  // Generate coordinates within ~10km radius of the city center
  const latOffset = (Math.random() - 0.5) * 0.18; // ~10km at equator
  const lngOffset = (Math.random() - 0.5) * 0.18;

  const lat = baseCity.lat + latOffset;
  const lng = baseCity.lng + lngOffset;

  // Ensure coordinates are within valid ranges
  const validLat = Math.max(-90, Math.min(90, lat));
  const validLng = Math.max(-180, Math.min(180, lng));

  return {
    lat: validLat,
    lng: validLng,
  };
}

function generatePincode(state: string): string {
  // Generate realistic Indian pincodes based on state
  const statePincodes: { [key: string]: string[] } = {
    Maharashtra: ["400", "411", "422", "431"],
    Delhi: ["110"],
    Karnataka: ["560", "570", "580"],
    Telangana: ["500", "502", "504"],
    "Tamil Nadu": ["600", "620", "630"],
    "West Bengal": ["700", "710", "720"],
    Gujarat: ["380", "390", "395"],
    Rajasthan: ["302", "313", "324"],
    "Uttar Pradesh": ["201", "226", "208"],
    "Madhya Pradesh": ["462", "452", "480"],
    "Andhra Pradesh": ["530", "515", "517"],
    Bihar: ["800", "801", "802"],
  };

  const prefixes = statePincodes[state] || ["400"];
  const prefix = getRandomElement(prefixes);
  const suffix = Math.floor(Math.random() * 100)
    .toString()
    .padStart(3, "0");

  return prefix + suffix;
}

async function generateUsers() {
  console.log("Generating users...");
  const users = [];

  // Generate more users to support more rooms
  for (let i = 0; i < 100; i++) {
    const name = getRandomElement(sampleNames);
    const email = `user${i + 1}@example.com`;
    const password = await bcrypt.hash("password123", 12);
    const userType = getRandomElement(["owner", "seeker", "both"]);
    const profileImage =
      Math.random() > 0.3 ? getRandomElement(profileImages) : undefined;

    users.push({
      name,
      email,
      password,
      userType,
      profileImage,
      phoneVerified: Math.random() > 0.5,
      phone:
        Math.random() > 0.4
          ? `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`
          : undefined,
      isSampleData: true,
    });
  }

  const createdUsers = await User.insertMany(users);
  console.log(`Created ${createdUsers.length} users`);
  return createdUsers;
}

async function generateRooms(users: unknown[]) {
  console.log("Generating rooms...");
  const rooms = [];

  // Get only owners and both type users
  const owners = users.filter(
    (user: any) => user.userType === "owner" || user.userType === "both"
  );

  // Generate 12,000 rooms for better distribution across cities
  for (let i = 0; i < 12000; i++) {
    const owner = getRandomElement(owners) as any;
    const city = getRandomElement(cities);
    const coordinates = generateRandomCoordinates(city);
    const roomType = getRandomElement(roomTypes);
    const selectedAmenities = getRandomElements(
      amenities,
      Math.floor(Math.random() * 8) + 3
    );
    const imageCount = Math.floor(Math.random() * 4) + 2; // 2-5 images
    const images = getRandomElements(roomImages, imageCount);

    const baseRent =
      roomType === "pg"
        ? 8000
        : roomType === "hostel"
          ? 6000
          : roomType === "single"
            ? 12000
            : roomType === "double"
              ? 18000
              : roomType === "shared"
                ? 8000
                : roomType === "studio"
                  ? 15000
                  : roomType === "1bhk"
                    ? 20000
                    : roomType === "2bhk"
                      ? 35000
                      : 50000;

    const rent = baseRent + Math.floor(Math.random() * baseRent * 0.5);

    const areas = [
      "Sector",
      "Block",
      "Phase",
      "Colony",
      "Nagar",
      "Vihar",
      "Enclave",
      "Extension",
      "Park",
      "Gardens",
      "Heights",
      "Residency",
      "Complex",
    ];

    const areaName = `${getRandomElement(areas)} ${Math.floor(Math.random() * 50) + 1
      }`;
    const address = `${Math.floor(Math.random() * 999) + 1}, ${areaName}, ${city.name
      }`;

    rooms.push({
      ownerId: owner._id,
      title: `${roomType.charAt(0).toUpperCase() + roomType.slice(1)
        } Room in ${areaName}`,
      description: `Beautiful ${roomType} room available for rent in ${city.name
        }. Well-maintained property with modern amenities. Perfect for ${roomType === "pg"
          ? "students and working professionals"
          : roomType === "shared"
            ? "sharing with roommates"
            : "comfortable living"
        }. Located in a prime area with easy access to public transport, markets, and restaurants.`,
      monthlyRent: rent,
      location: {
        address,
        coordinates: {
          type: "Point",
          coordinates: [coordinates.lng, coordinates.lat], // [longitude, latitude]
        },
        city: city.name,
        state: city.state,
        pincode: generatePincode(city.state),
      },
      images,
      amenities: selectedAmenities,
      roomType,
      availability: Math.random() > 0.1, // 90% available
      isSampleData: true,
    });
  }

  const createdRooms = await Room.insertMany(rooms);
  console.log(`Created ${createdRooms.length} rooms`);
  return createdRooms;
}

export async function generateSampleData() {
  try {
    await connectDB();

    // Clear existing sample data only
    console.log("Clearing existing sample data...");
    await User.deleteMany({ isSampleData: true });
    await Room.deleteMany({ isSampleData: true });

    // Generate new data
    const users = await generateUsers();
    const rooms = await generateRooms(users);

    console.log("Sample data generation completed!");
    console.log(`Total users: ${users.length}`);
    console.log(`Total rooms: ${rooms.length}`);

    return { users, rooms };
  } catch (error) {
    console.error("Error generating sample data:", error);
    throw error;
  }
}

// If running this file directly
if (require.main === module) {
  generateSampleData()
    .then(() => {
      console.log("Sample data generated successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to generate sample data:", error);
      process.exit(1);
    });
}
