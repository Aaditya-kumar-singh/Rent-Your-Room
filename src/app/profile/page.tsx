import { redirect } from "next/navigation";

export default function ProfilePage() {
  // Redirect to dashboard with profile tab
  redirect("/dashboard?tab=profile");
}
