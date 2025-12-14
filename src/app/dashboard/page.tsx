import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardClient from "@/components/dashboard/DashboardClient";

interface DashboardPageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Check if user has a valid userType, if not redirect to user-type selection
  const user = session.user as typeof session.user & {
    userType?: "owner" | "seeker" | "both" | "admin";
  };

  if (
    !user.userType ||
    !["owner", "seeker", "both", "admin"].includes(user.userType)
  ) {
    redirect("/auth/user-type");
  }

  const params = await searchParams;
  const initialTab = params?.tab || "dashboard";

  return <DashboardClient session={session} initialTab={initialTab} />;
}
