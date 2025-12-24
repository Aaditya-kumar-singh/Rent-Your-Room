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
      session.user = session.user || {};
      session.user.id = token.id;
      session.user.userType = token.userType;
      session.user.phoneVerified = token.phoneVerified;
      // Prioritize the image from the token (which comes from DB)
      session.user.image = token.picture || token.image || session.user.image;
      session.user.name = token.name || session.user.name;
      session.user.email = token.email || session.user.email;

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
            dbUser = await User.findOne({ email: user.email });
          }

          // Ensure basic fields are on the token
          token.email = user.email;

          if (dbUser) {
            token.id = dbUser._id.toString();
            token.userType = dbUser.userType;
            token.phoneVerified = dbUser.phoneVerified;
            token.name = dbUser.name || user.name;
            token.picture = dbUser.profileImage || user.image;
          }
        } catch (e) {
          console.error("JWT Initial Signin Error", e);
        }
      }
      // 2. Session Update Trigger - Refresh from DB
      else if (trigger === "update") {
        console.log("Session update triggered");
        try {
          await connectDB();
          if (token.id) {
            const dbUser = await User.findById(token.id);
            if (dbUser) {
              token.userType = dbUser.userType;
              token.phoneVerified = dbUser.phoneVerified;
              token.name = dbUser.name || token.name;
              token.picture = dbUser.profileImage || token.picture;
              token.email = dbUser.email || token.email;
            }
          }
          if (session) {
            token.userType = session.userType || token.userType;
            token.picture = session.image || token.picture;
            token.name = session.name || token.name;
          }
        } catch (e) {
          console.error("JWT Session Update Error", e);
        }
      }
      // 3. Subsequent requests
      else {
        const userId = token.id || token.sub;
        // Fallback verify if missing key data
        if ((!token.picture || !token.name || !token.email) && userId) {
          try {
            await connectDB();
            const dbUser = await User.findById(userId);
            if (dbUser) {
              token.id = dbUser._id.toString(); // Ensure ID is set
              token.email = dbUser.email || token.email;
              token.name = dbUser.name || token.name;
              token.picture = dbUser.profileImage || token.picture;
              token.userType = dbUser.userType || token.userType;
              token.phoneVerified = dbUser.phoneVerified ?? token.phoneVerified;
            }
          } catch (e) {
            console.error("JWT Re-fetch Error", e);
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
  // Trust Host is required for deployments behind proxies (like AWS Amplify)
  // to ensure the correct NEXTAUTH_URL is respected.
  trustHost: true,
  // Force the URL if environment variable is missing but we know we are in prod
  // This is a fallback to ensure we never redirect to localhost in production
  ...(process.env.NODE_ENV === "production" && {
    secret: process.env.NEXTAUTH_SECRET, // explicit secret
    // If NEXTAUTH_URL is missing, use the hardcoded Amplify domain
    baseUrl: process.env.NEXTAUTH_URL || "https://master.d136gzxnnpn7xq.amplifyapp.com"
  })
};
