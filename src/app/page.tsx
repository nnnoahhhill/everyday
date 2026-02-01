import DashboardClient from "@/components/dashboard/dashboard-client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const session = cookieStore.get("tide_session")?.value;

  if (session !== "admin") {
    redirect("/login");
  }

  return <DashboardClient />;
}