"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import PhoneVerification from "@/components/auth/PhoneVerification";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  profileImage?: string;
  userType: "owner" | "seeker" | "both";
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UserProfile() {
  const { update } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [userType, setUserType] = useState<"owner" | "seeker" | "both">(
    "seeker"
  );

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      const data = await response.json();

      if (response.ok) {
        setProfile(data.profile);
        setName(data.profile.name);
        setUserType(data.profile.userType);
      } else {
        setError(data.error || "Failed to load profile");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          userType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data.profile);
        setSuccess("Profile updated successfully!");
        // Update session to reflect changes
        await update();
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handlePhoneVerificationComplete = async () => {
    setShowPhoneVerification(false);
    setSuccess("Phone number verified successfully!");
    await fetchProfile(); // Refresh profile data
    await update(); // Update session
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "profile");

      const response = await fetch("/api/upload/images", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Update profile with new image URL
        const updateResponse = await fetch("/api/user/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profileImage: data.url,
          }),
        });

        if (updateResponse.ok) {
          const updateData = await updateResponse.json();
          setProfile(updateData.profile);
          setSuccess("Profile picture updated successfully!");
          await update(); // Update session
        } else {
          setError("Failed to update profile picture");
        }
      } else {
        setError(data.error || "Failed to upload image");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showPhoneVerification) {
    return (
      <PhoneVerification
        onVerificationComplete={handlePhoneVerificationComplete}
        onCancel={() => setShowPhoneVerification(false)}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">User Profile</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {profile && (
        <div className="space-y-6">
          {/* Profile Image */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {profile.profileImage ? (
                  <Image
                    src={profile.profileImage}
                    alt="Profile"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500 text-xl">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <label
                htmlFor="profile-image-upload"
                className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1 cursor-pointer hover:bg-blue-700 transition-colors"
              >
                {uploadingImage ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </label>
              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImage}
              />
            </div>
            <div>
              <h3 className="text-lg font-medium">{profile.name}</h3>
              <p className="text-gray-600">{profile.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                Click the camera icon to update your profile picture
              </p>
            </div>
          </div>

          {/* Phone Verification Status */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Phone Number</h4>
                <p className="text-sm text-gray-600">
                  {profile.phone ? (
                    <>
                      {profile.phone}
                      {profile.phoneVerified ? (
                        <span className="ml-2 text-green-600">✓ Verified</span>
                      ) : (
                        <span className="ml-2 text-red-600">
                          ✗ Not Verified
                        </span>
                      )}
                    </>
                  ) : (
                    "Not provided"
                  )}
                </p>
              </div>
              {!profile.phoneVerified && (
                <button
                  onClick={() => setShowPhoneVerification(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  {profile.phone ? "Verify" : "Add Phone"}
                </button>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="userType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Account Type
              </label>
              <select
                id="userType"
                value={userType}
                onChange={(e) =>
                  setUserType(e.target.value as "owner" | "seeker" | "both")
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="seeker">Room Seeker</option>
                <option value="owner">Property Owner</option>
                <option value="both">Both (Seeker & Owner)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose your primary role on the platform
              </p>
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {updating ? "Updating..." : "Update Profile"}
            </button>
          </form>

          {/* Account Info */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Account Information</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                Member since: {new Date(profile.createdAt).toLocaleDateString()}
              </p>
              <p>
                Last updated: {new Date(profile.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
