"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@/generated/prisma/client";

type NavLink = { href: string; label: string };

const LINKS_BY_ROLE: Record<Role, NavLink[]> = {
  CUSTOMER: [
    { href: "/dashboard/customer", label: "My Orders" },
    { href: "/dashboard/customer/new", label: "New Order" },
  ],
  AGENT: [{ href: "/dashboard/agent", label: "My Deliveries" }],
  ADMIN: [
    { href: "/dashboard/admin", label: "Orders" },
    { href: "/dashboard/admin/zones", label: "Zones" },
    { href: "/dashboard/admin/rate-cards", label: "Rate Cards" },
    { href: "/dashboard/admin/agents", label: "Agents" },
  ],
};

export function DashboardNav({
  role,
  name,
}: {
  role: Role;
  name: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const links = LINKS_BY_ROLE[role];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
            Last-Mile Tracker
          </Link>
          <nav className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-foreground",
                  pathname === link.href && "bg-background text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">
            {name} <span className="text-xs">({role})</span>
          </span>
          <button
            onClick={logout}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
