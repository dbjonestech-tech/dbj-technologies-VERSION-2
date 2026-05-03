import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signOutAction } from "@/lib/auth/actions";
import { LogOut } from "lucide-react";
import { getPalette } from "@/lib/admin/page-themes";
import { buildAdminNavGroups } from "@/lib/admin/nav-config";
import { getContactsDashboardSummary } from "@/lib/services/contacts";
import { ToastProvider } from "./components/Toast";
import CommandPalette from "./components/CommandPalette";
import MobileSidebar from "./components/MobileSidebar";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | DBJ Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect("/signin?callbackUrl=/admin");
  }
  /* Sidebar overdue badge: cheap query against the partial
   * idx_contacts_follow_up index. Keeps the badge live across every
   * /admin page without requiring per-page wiring. Best-effort: any
   * failure inside getContactsDashboardSummary already returns zeros. */
  const summary = await getContactsDashboardSummary();
  const navGroups = buildAdminNavGroups(summary.overdue);

  return (
    <ToastProvider>
      <div className="min-h-screen w-full" style={{ backgroundColor: "#FAFAFA" }}>
        <div className="flex min-h-screen">
          <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex">
            <div className="flex items-center border-b border-zinc-200 px-5 py-5">
              <CanopyWordmark />
            </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {navGroups.map((group) => (
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
                          <span className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-sm text-zinc-400 opacity-60">
                            <Icon className="h-4 w-4 opacity-60" aria-hidden="true" />
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
                          {item.badge && item.badge.count > 0 ? (
                            <span
                              aria-label={`${item.badge.count} overdue`}
                              className={`ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${
                                item.badge.tone === "danger"
                                  ? "bg-red-500 text-white"
                                  : "bg-zinc-200 text-zinc-700"
                              }`}
                            >
                              {item.badge.count}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="border-t border-zinc-200 px-3 py-4">
            <div className="mb-3 flex items-center justify-between px-3">
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">Signed in as</p>
                <p className="truncate text-sm font-medium text-zinc-900">
                  {session.user.email}
                </p>
              </div>
              <kbd
                title="Open command palette"
                className="ml-2 hidden rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 lg:inline"
              >
                ⌘K
              </kbd>
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
          <header className="flex min-h-14 items-center gap-3 border-b border-zinc-200 bg-white px-4 py-2 lg:hidden">
            <MobileSidebar
              overdueCount={summary.overdue}
              signedInEmail={session.user.email ?? ""}
            />
            <CanopyWordmark />
          </header>
          <div className="flex-1 overflow-x-hidden">{children}</div>
        </main>
      </div>
      </div>
      <CommandPalette />
    </ToastProvider>
  );
}

/**
 * Canopy wordmark for the admin shell. Renders the simplified tree icon
 * (/public/canopy-icon.webp, transparent background) alongside the
 * "Canopy" name and a "by DBJ Technologies" attribution as live text.
 * The full tree+wordmark image (/public/canopy-logo.webp) is reserved
 * for marketing surfaces where it can render large enough for the
 * embedded wordmark to be legible. The /admin shell is the design
 * prototype for the Canopy product per project_canopy_brand memory.
 */
function CanopyWordmark() {
  return (
    <Link
      href="/admin"
      aria-label="Canopy by DBJ Technologies"
      className="inline-flex items-center gap-2.5"
    >
      <Image
        src="/canopy-icon.webp"
        alt=""
        aria-hidden
        width={64}
        height={64}
        priority
        className="h-16 w-16 shrink-0"
      />
      <span className="flex flex-col leading-tight">
        <span className="text-lg font-semibold tracking-tight text-zinc-900">
          Canopy
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          by DBJ Technologies
        </span>
      </span>
    </Link>
  );
}
