import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  phone?: string;
  name: string;
  profileImage?: string;
  userType: "owner" | "seeker" | "both" | "admin";
  googleId?: string;
  password?: string;
  phoneVerified: boolean;
  isSampleData: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      sparse: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    profileImage: {
      type: String,
    },
    userType: {
      type: String,
      enum: ["owner", "seeker", "both", "admin"],
      default: "seeker",
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    password: {
      type: String,
      select: false, // Don't include password in queries by default
    },
    phoneVerified: {
      type: Boolean,
      default: false,
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

// Indexes are automatically created by unique: true, so no need for manual indexes

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
