import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRoom extends Document {
  ownerId: Types.ObjectId;
  title: string;
  description: string;
  monthlyRent: number;
  location: {
    address: string;
    coordinates: {
      type: "Point";
      coordinates: [number, number]; // [longitude, latitude]
    };
    city: string;
    state: string;
    pincode: string;
  };
  images: string[];
  amenities: string[];
  roomType: string;
  availability: boolean;
  isSampleData: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema(
  {
    address: {
      type: String,
      required: true,
      trim: true,
    },
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (coords: number[]) {
            return (
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 && // longitude
              coords[1] >= -90 &&
              coords[1] <= 90
            ); // latitude
          },
          message:
            "Coordinates must be [longitude, latitude] with valid ranges",
        },
      },
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      match: /^[1-9][0-9]{5}$/, // Indian pincode format
    },
  },
  { _id: false }
);

// Ensure coordinates accept { lat, lng } at the subdocument level as well
LocationSchema.pre("validate", function (next) {
  const doc: any = this as any;
  const coords = doc?.coordinates;
  if (coords && typeof coords === "object" && "lat" in coords && "lng" in coords) {
    const { lat, lng } = coords as { lat: number; lng: number };
    doc.coordinates = {
      type: "Point",
      coordinates: [lng, lat],
    };
  }
  next();
});

// Intercept assignments to 'coordinates' to support { lat, lng } input
const coordPath: any = LocationSchema.path("coordinates");
if (coordPath && typeof coordPath.set === "function") {
  coordPath.set(function (value: any) {
    if (value && typeof value === "object" && "lat" in value && "lng" in value) {
      const { lat, lng } = value as { lat: number; lng: number };
      return { type: "Point", coordinates: [lng, lat] };
    }
    return value;
  });
}

const RoomSchema = new Schema<IRoom>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    monthlyRent: {
      type: Number,
      required: true,
      min: 0,
    },
    location: {
      type: LocationSchema,
      required: true,
    },
    images: {
      type: [String],
      validate: {
        validator: function (images: string[]) {
          return images.length > 0 && images.length <= 10;
        },
        message: "Room must have between 1 and 10 images",
      },
    },
    amenities: {
      type: [String],
      default: [],
    },
    roomType: {
      type: String,
      required: true,
      enum: [
        "single",
        "double",
        "shared",
        "studio",
        "1bhk",
        "2bhk",
        "3bhk",
        "pg",
        "hostel",
      ],
    },
    availability: {
      type: Boolean,
      default: true,
    },
    isSampleData: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Normalize incoming coordinates that might be provided as { lat, lng }
RoomSchema.pre("validate", function (next) {
  const doc: any = this as any;
  const coords = doc?.location?.coordinates;
  if (
    coords &&
    typeof coords === "object" &&
    "lat" in coords &&
    "lng" in coords
  ) {
    const { lat, lng } = coords as { lat: number; lng: number };
    doc.location.coordinates = {
      type: "Point",
      coordinates: [lng, lat],
    };
  }
  next();
});

// Create indexes for better performance and geospatial queries
RoomSchema.index({ ownerId: 1 });
RoomSchema.index({ availability: 1 });
RoomSchema.index({ monthlyRent: 1 });
RoomSchema.index({ roomType: 1 });
RoomSchema.index({ "location.city": 1 });
RoomSchema.index({ "location.state": 1 });
RoomSchema.index({ "location.pincode": 1 });

// Geospatial index for location-based queries
RoomSchema.index({ "location.coordinates": "2dsphere" });

// Compound indexes for common queries
RoomSchema.index({ availability: 1, monthlyRent: 1 });
RoomSchema.index({ "location.city": 1, availability: 1 });
RoomSchema.index({ roomType: 1, availability: 1 });

// Text index for search functionality
RoomSchema.index({
  title: "text",
  description: "text",
  "location.address": "text",
  "location.city": "text",
});

export default mongoose.models.Room ||
  mongoose.model<IRoom>("Room", RoomSchema);
