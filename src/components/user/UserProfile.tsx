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
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showPhoneVerification) {
    return (
      <div className="max-w-md mx-auto">
        <PhoneVerification
          onVerificationComplete={handlePhoneVerificationComplete}
          onCancel={() => setShowPhoneVerification(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-1">
        <h3 className="text-lg font-medium leading-6 text-foreground">Profile Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your public profile and account preferences.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Status Messages */}
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/50">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/50">
            {success}
          </div>
        )}

        {profile && (
          <>
            {/* Avatar Section */}
            <div className="flex items-start space-x-6 pb-6 border-b border-border">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border bg-muted">
                  {profile.profileImage ? (
                    <Image
                      src={profile.profileImage}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-2xl font-bold">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <label
                  htmlFor="profile-image-upload"
                  className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  {uploadingImage ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
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

              <div className="flex-1 space-y-1 pt-2">
                <h4 className="text-base font-medium text-foreground">{profile.name}</h4>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <p className="text-xs text-muted-foreground">Recommended size: 500x500px. Max 5MB.</p>
              </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="userType" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Account Type
                  </label>
                  <select
                    id="userType"
                    value={userType}
                    onChange={(e) => setUserType(e.target.value as any)}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="seeker">Room Seeker</option>
                    <option value="owner">Property Owner</option>
                    <option value="both">Both (Seeker & Owner)</option>
                  </select>
                </div>
              </div>

              {/* Phone Verification */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Phone Number</label>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {profile.phone ? profile.phone : "No phone number added"}
                      {profile.phone && (
                        profile.phoneVerified ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            Unverified
                          </span>
                        )
                      )}
                    </div>
                  </div>
                  {!profile.phoneVerified && (
                    <button
                      type="button"
                      onClick={() => setShowPhoneVerification(true)}
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors border border-input rounded-md hover:bg-background hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {profile.phone ? "Verify Now" : "Add Phone"}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition-colors bg-primary rounded-md hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {updating ? (
                    <>
                      <span className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>

            {/* Footer Metadata */}
            <div className="pt-6 mt-6 border-t border-border text-xs text-muted-foreground flex justify-between">
              <span>Member since {new Date(profile.createdAt).toLocaleDateString()}</span>
              <span>Last updated {new Date(profile.updatedAt).toLocaleDateString()}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
