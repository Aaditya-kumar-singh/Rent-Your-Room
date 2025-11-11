// Using any types to avoid import issues with NextAuth v4
type NextAuthUser = any;
type Account = any;
type Profile = any;
type Session = any;
type JWT = unknown;
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "./mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();

          const user = await User.findOne({ email: credentials.email }).select(
            "+password"
          );

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.profileImage,
          };
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({
      user,
      account,
      profile,
    }: {
      user: NextAuthUser;
      account: Account | null;
      profile?: Profile;
    }) {
      if (account?.provider === "google") {
        try {
          await connectDB();

          // Check if user exists, if not create with Google data
          let existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            existingUser = await User.create({
              email: user.email,
              name: user.name || profile?.name || "",
              profileImage:
                user.image || (profile as { picture?: string })?.picture,
              googleId: account.providerAccountId,
              userType: "seeker", // Default to seeker, will be updated in user-type page
              phoneVerified: false,
            });
          } else if (!existingUser.googleId) {
            // Link Google account to existing user
            existingUser.googleId = account.providerAccountId;
            existingUser.profileImage =
              existingUser.profileImage ||
              user.image ||
              (profile as { picture?: string })?.picture;
            await existingUser.save();
          }

          return true;
        } catch (error) {
          console.error("Google sign-in error:", error);
          return false;
        }
      }

      if (account && account.provider === "credentials") {
        return true; // Credentials are already validated in authorize function
      }

      return true;
    },
    async session({ session, token }: { session: any; token: any }) {
      console.log("Session callback - token:", token);
      console.log("Session callback - session before update:", session);

      if (session.user && (token as any).id) {
        try {
          await connectDB();

          let dbUser;

          // Check if token.id is a valid MongoDB ObjectId (24 characters)
          if (
            typeof (token as any).id === "string" &&
            (token as any).id.length === 24
          ) {
            // It's a MongoDB ObjectId
            console.log(
              "Session callback - looking up user by MongoDB ID:",
              (token as any).id
            );
            dbUser = await User.findById((token as any).id);
          } else {
            // It's likely a Google ID, find by googleId or email
            console.log(
              "Session callback - looking up user by Google ID or email"
            );
            dbUser = await User.findOne({
              $or: [
                { googleId: (token as any).id },
                { email: session.user.email },
              ],
            });
          }

          if (dbUser) {
            session.user.id = dbUser._id.toString();
            session.user.userType = dbUser.userType;
            session.user.phoneVerified = dbUser.phoneVerified;
            session.user.phone = dbUser.phone;
            console.log("Session callback - updated session with user data:", {
              id: session.user.id,
              userType: session.user.userType,
              phoneVerified: session.user.phoneVerified,
            });
          } else {
            console.error(
              "Session callback - no dbUser found for token ID:",
              (token as any).id,
              "email:",
              session.user.email
            );
          }
        } catch (error) {
          console.error("Session update error:", error);
        }
      } else {
        console.error("Session callback - missing session.user or token.id");
      }
      return session;
    },
    async jwt({
      token,
      user,
      account,
    }: {
      token: any;
      user?: any;
      account?: any;
    }) {
      console.log("JWT callback - user:", user, "account:", account?.provider);

      if (user && account) {
        if (account.provider === "google") {
          // For Google OAuth, find the user in database and store their MongoDB ID
          try {
            await connectDB();
            const dbUser = await User.findOne({ email: user.email });
            if (dbUser) {
              (token as any).id = dbUser._id.toString();
              console.log(
                "JWT callback - set token.id from Google user:",
                (token as any).id
              );
            } else {
              console.error(
                "JWT callback - no dbUser found for Google email:",
                user.email
              );
            }
          } catch (error) {
            console.error("JWT Google OAuth error:", error);
          }
        } else {
          // For credentials, user.id is already the MongoDB ObjectId
          (token as any).id = user.id;
          console.log(
            "JWT callback - set token.id from credentials user:",
            (token as any).id
          );
        }
      } else if (
        (token as any).id &&
        typeof (token as any).id === "string" &&
        (token as any).id.length > 24
      ) {
        // Handle existing Google OAuth tokens that still have Google ID instead of MongoDB ID
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.log(
          "JWT callback - migrating old Google token ID:",
          (token as any).id
        );
        try {
          await connectDB();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dbUser = await User.findOne({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            googleId: (token as any).id,
          });
          if (dbUser) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (token as any).id = dbUser._id.toString();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            console.log("JWT callback - migrated token.id:", (token as any).id);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            console.error(
              "JWT callback - no dbUser found for Google ID:",
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (token as any).id
            );
          }
        } catch (error) {
          console.error("JWT token migration error:", error);
        }
      } else {
        console.log(
          "JWT callback - token.id already set:",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (token as any).id
        );
      }
      return token;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Handles sign out redirects properly
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};
