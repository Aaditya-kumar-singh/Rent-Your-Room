import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Room from "@/models/Room";
import { generateSampleData } from "./generateSampleData";

async function clearAndRegenerate() {
  try {
    await connectDB();

    console.log("Clearing all existing data...");

    // Clear all data (both users and rooms)
    await User.deleteMany({});
    await Room.deleteMany({});

    console.log("All data cleared. Generating new sample data...");

    // Generate new sample data with isSampleData field
    const result = await generateSampleData();

    console.log("Sample data regenerated successfully!");
    console.log(`Users created: ${result.users.length}`);
    console.log(`Rooms created: ${result.rooms.length}`);

    return result;
  } catch (error) {
    console.error("Clear and regenerate failed:", error);
    throw error;
  }
}

export { clearAndRegenerate };

// If running this file directly
if (require.main === module) {
  clearAndRegenerate()
    .then((result) => {
      console.log("Clear and regenerate completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Clear and regenerate failed:", error);
      process.exit(1);
    });
}
