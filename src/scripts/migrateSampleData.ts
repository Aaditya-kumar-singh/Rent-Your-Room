import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Room from "@/models/Room";

async function migrateSampleData() {
  try {
    await connectDB();

    console.log("Starting sample data migration...");

    // Update all existing users to mark them as sample data
    // (since we know all current data is sample data)
    const userResult = await User.updateMany(
      { isSampleData: { $exists: false } },
      { $set: { isSampleData: true } }
    );

    console.log(
      `Updated ${userResult.modifiedCount} users with isSampleData field`
    );

    // Update all existing rooms to mark them as sample data
    const roomResult = await Room.updateMany(
      { isSampleData: { $exists: false } },
      { $set: { isSampleData: true } }
    );

    console.log(
      `Updated ${roomResult.modifiedCount} rooms with isSampleData field`
    );

    console.log("Migration completed successfully!");

    return {
      usersUpdated: userResult.modifiedCount,
      roomsUpdated: roomResult.modifiedCount,
    };
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

export { migrateSampleData };

// If running this file directly
if (require.main === module) {
  migrateSampleData()
    .then((result) => {
      console.log("Migration result:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}
