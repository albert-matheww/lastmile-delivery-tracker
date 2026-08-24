import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

const ROLE_HOME: Record<string, string> = {
  CUSTOMER: "/dashboard/customer",
  AGENT: "/dashboard/agent",
  ADMIN: "/dashboard/admin",
};

export default async function DashboardIndex() {
  const user = await getCurrentUser();
  redirect(ROLE_HOME[user?.role ?? ""] ?? "/login");
}
