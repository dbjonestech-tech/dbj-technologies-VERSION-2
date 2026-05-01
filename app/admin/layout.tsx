import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signOutAction } from "@/lib/auth/actions";
import {
  LogOut,
  LayoutDashboard,
  Activity,
  DollarSign,
  Database,
  Mail,
  Users,
  FileText,
  Briefcase,
  Globe,
  Filter,
  Repeat,
  Search,
  Server,
  Workflow,
  Wifi,
  AlertTriangle,
  Zap,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { getPalette, type PaletteName } from "@/lib/admin/page-themes";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | DBJ Admin" },
  robots: { index: false, follow: false, nocache: true },
};

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  /* Palette name pulled into class strings on the rendered Link.
   * Mirrors PAGE_PALETTE in lib/admin/page-themes.ts so the sidebar
   * label/icon color matches the destination page's identity. */
  palette: PaletteName;
  disabled?: boolean;
};

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, palette: "zinc" },
    ],
  },
  {
    label: "Acquisition",
    items: [
      { label: "Visitors", href: "/admin/visitors", icon: Globe, palette: "sky" },
      { label: "Recurring users", href: "/admin/recurring", icon: Repeat, palette: "pink" },
      { label: "Funnel", href: "/admin/funnel", icon: Filter, palette: "violet" },
      { label: "Search", href: "/admin/search", icon: Search, palette: "indigo" },
      { label: "RUM", href: "/admin/performance/rum", icon: Zap, palette: "fuchsia" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Monitor", href: "/admin/monitor", icon: Activity, palette: "cyan" },
      { label: "Costs", href: "/admin/costs", icon: DollarSign, palette: "amber" },
      { label: "Scans", href: "/admin/scans", icon: FileText, palette: "teal" },
      { label: "Leads", href: "/admin/leads", icon: Mail, palette: "blue" },
      { label: "Clients", href: "/admin/clients", icon: Briefcase, palette: "yellow" },
      { label: "Database", href: "/admin/database", icon: Database, palette: "orange" },
    ],
  },
  {
    label: "Health",
    items: [
      { label: "Pipeline", href: "/admin/pipeline", icon: Workflow, palette: "emerald" },
      { label: "Platform", href: "/admin/platform", icon: Server, palette: "green" },
      { label: "Errors", href: "/admin/errors", icon: AlertTriangle, palette: "red" },
      { label: "Email", href: "/admin/email", icon: Mail, palette: "purple" },
      { label: "Infrastructure", href: "/admin/infrastructure", icon: Wifi, palette: "lime" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Audit log", href: "/admin/audit", icon: ShieldCheck, palette: "stone" },
      { label: "Users", href: "/admin/users", icon: Users, palette: "zinc" },
      { label: "Config", href: "/admin/config", icon: Settings, palette: "teal" },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect("/signin?callbackUrl=/admin");
  }

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#FAFAFA" }}>
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex">
          <div className="flex h-16 items-center border-b border-zinc-200 px-5">
            <CanopyWordmark />
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mb-6">
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    if (item.disabled) {
                      return (
                        <li key={item.label}>
                          <span className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-sm text-zinc-400">
                            <Icon className="h-4 w-4" aria-hidden="true" />
                            <span>{item.label}</span>
                            <span className="ml-auto text-[10px] uppercase tracking-wider text-zinc-300">
                              soon
                            </span>
                          </span>
                        </li>
                      );
                    }
                    /* Pull the palette tokens for this item so the
                     * sidebar label/icon match the destination page's
                     * color identity. The icon uses iconColor (-700)
                     * and the label uses pageEyebrow (also -700);
                     * pulling from a shared map keeps them in sync
                     * with the dashboard card and the page header. */
                    const tokens = getPalette(item.href);
                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className={`group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 ${tokens.pageEyebrow}`}
                        >
                          <Icon
                            className={`h-4 w-4 ${tokens.iconColor}`}
                            aria-hidden="true"
                          />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="border-t border-zinc-200 px-3 py-4">
            <div className="mb-3 px-3">
              <p className="text-xs text-zinc-500">Signed in as</p>
              <p className="truncate text-sm font-medium text-zinc-900">
                {session.user.email}
              </p>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </form>
          </div>
        </aside>

        <main className="flex flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 lg:hidden">
            <CanopyWordmark />

            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </header>
          <div className="flex-1 overflow-x-hidden">{children}</div>
        </main>
      </div>
    </div>
  );
}

/**
 * Canopy wordmark for the admin shell. Renders /public/canopy-logo.webp
 * (the official tree-and-wordmark logo, cyan on dark) with a small
 * "by DBJ" attribution beside it. The /admin shell is the design
 * prototype for the Canopy product per project_canopy_brand memory.
 */
function CanopyWordmark() {
  return (
    <Link
      href="/admin"
      aria-label="Canopy"
      className="inline-flex items-center gap-3"
    >
      <Image
        src="/canopy-logo.webp"
        alt="Canopy"
        width={56}
        height={42}
        priority
        className="h-10 w-auto rounded-md"
      />
      <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        by DBJ
      </span>
    </Link>
  );
}
