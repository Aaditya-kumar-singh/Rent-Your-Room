
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const BROKEN_REGEX = /photo-1494790108755/;

async function run() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();

        const badUsers = await db.collection('users').countDocuments({ profileImage: { $regex: BROKEN_REGEX } });
        const badRooms = await db.collection('rooms').countDocuments({ images: { $regex: BROKEN_REGEX } });

        console.log(`Still broken: ${badUsers} users, ${badRooms} rooms.`);

        if (badUsers > 0 || badRooms > 0) {
            console.log("Found broken images. Attempting fix again...");
            const REPLACEMENT_URL = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150";

            await db.collection('users').updateMany(
                { profileImage: { $regex: BROKEN_REGEX } },
                { $set: { profileImage: REPLACEMENT_URL } }
            );

            // Fix rooms string check
            await db.collection('rooms').updateMany(
                { images: { $regex: BROKEN_REGEX } },
                { $set: { "images.$[element]": REPLACEMENT_URL } },
                { arrayFilters: [{ "element": { $regex: BROKEN_REGEX } }] }
            );
            console.log("Fix applied.");
        }

    } finally {
        await client.close();
    }
}
run();
