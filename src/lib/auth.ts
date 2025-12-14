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
      if (session.user) {
        session.user.id = token.id;
        session.user.userType = token.userType;
        session.user.phoneVerified = token.phoneVerified;
        // Prioritize the image from the token (which comes from DB)
        session.user.image = token.picture || token.image || session.user.image;
        session.user.name = token.name || session.user.name;
      }
      return session;
    },
    async jwt({
      token,
      user,
      account,
      trigger,
      session
    }: {
      token: any;
      user?: any;
      account?: any;
      trigger?: string;
      session?: any;
    }) {
      // 1. Initial Sign In
      if (user && account) {
        try {
          await connectDB();
          let dbUser;

          if (account.provider === 'google') {
            dbUser = await User.findOne({ email: user.email });
          } else {
            // For credentials, user is already the DB user object (or similar)
            // But let's be safe and re-fetch or use what we have
            dbUser = await User.findOne({ email: user.email });
          }

          if (dbUser) {
            token.id = dbUser._id.toString();
            token.userType = dbUser.userType;
            token.phoneVerified = dbUser.phoneVerified;
            token.name = dbUser.name || user.name; // Ensure name is in token
            // Use DB profile image if it exists, otherwise fallback to Google/User image
            token.picture = dbUser.profileImage || user.image;
          }
        } catch (e) {
          console.error("JWT Initial Signin Error", e);
        }
      }
      // 2. Subsequent requests (Token exists) or Session Update
      else {
        // If this is a session update trigger, merge new data
        if (trigger === "update" && session) {
          token.userType = session.userType || token.userType;
          token.picture = session.image || token.picture;
          token.name = session.name || token.name;
        }

        // Optional: Periodically re-sync with DB (e.g., if we want to catch external changes)
        // For now, we'll rely on the session update mechanism or initial load.
        // However, to fix the specific "missing photo" or "missing name" issue, let's try to fetch if missing.
        if ((!token.picture || !token.name) && token.id) {
          try {
            await connectDB();
            const dbUser = await User.findById(token.id);
            if (dbUser) {
              token.picture = dbUser.profileImage || token.picture;
              token.name = dbUser.name || token.name;
            }
          } catch (e) {
            console.error("JWT Re-fetch error", e);
          }
        }
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
