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
    <header className="bg-route text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between py-3">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
            <span
              aria-hidden
              className="grid h-6 w-6 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-white text-[10px] font-bold"
              style={{ transform: "rotate(-6deg)" }}
            >
              LM
            </span>
            <span className="hidden font-display text-sm font-bold uppercase tracking-[0.14em] sm:inline">
              Last-Mile Tracker
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-white/70 sm:inline">
              {name} · <span className="font-manifest uppercase">{role}</span>
            </span>
            <button
              onClick={logout}
              className="shrink-0 rounded-[3px] border-[1.5px] border-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white/10"
            >
              Log out
            </button>
          </div>
        </div>
        <nav className="-mx-4 flex items-stretch gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex shrink-0 items-center whitespace-nowrap border-b-[3px] px-2 py-3 text-sm font-medium tracking-wide text-white/65 transition-colors hover:text-white",
                  active ? "border-white text-white" : "border-transparent"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
