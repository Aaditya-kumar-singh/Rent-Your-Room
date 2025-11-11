declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      userType: "owner" | "seeker" | "both" | "admin";
      phoneVerified: boolean;
      phone?: string;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    userType: "owner" | "seeker" | "both" | "admin";
    phoneVerified: boolean;
    phone?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    userType: "owner" | "seeker" | "both" | "admin";
    phoneVerified: boolean;
    phone?: string;
  }
}
