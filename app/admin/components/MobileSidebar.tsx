"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogOut, Menu, X } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import { buildAdminNavGroups } from "@/lib/admin/nav-config";
import { getPalette } from "@/lib/admin/page-themes";

/* Mobile sidebar drawer for the Canopy admin shell.
 *
 * Renders a hamburger trigger inline (parent positions it via flexbox).
 * Tap opens a left-edge drawer that slides in over the content with a
 * backdrop. Drawer auto-closes on route change, Esc, or backdrop click.
 * Body scroll is locked while open so iOS doesn't rubber-band the
 * underlying page.
 *
 * The drawer mirrors the desktop aside: same nav groups, same overdue
 * badge, same sign-out. Source of truth for the nav data is
 * lib/admin/nav-config.ts so a new sidebar entry only has to be added
 * once. */

interface Props {
  overdueCount: number;
  signedInEmail: string;
}

export default function MobileSidebar({ overdueCount, signedInEmail }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  /* Close on route change. The drawer is full-bleed on mobile so an
   * accidental drawer-still-open after navigation would obscure the
   * destination page. */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* Esc to close. */
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /* Body scroll lock while open so the drawer doesn't drift on iOS. */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* Focus the first nav link once the drawer settles. */
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => firstLinkRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open]);

  const groups = buildAdminNavGroups(overdueCount);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-controls="mobile-admin-drawer"
        aria-expanded={open}
        className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-700 transition-colors hover:bg-zinc-100"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-drawer-root"
            className="fixed inset-0 z-[55] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.2 }}
          >
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
              className="absolute inset-0 cursor-default bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.aside
              id="mobile-admin-drawer"
              role="dialog"
              aria-label="Admin navigation"
              aria-modal="true"
              initial={
                reduced ? { opacity: 0 } : { x: "-100%", opacity: 1 }
              }
              animate={
                reduced ? { opacity: 1 } : { x: 0, opacity: 1 }
              }
              exit={
                reduced
                  ? { opacity: 0, transition: { duration: 0.12 } }
                  : { x: "-100%", transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }
              }
              transition={
                reduced
                  ? { duration: 0.18 }
                  : { type: "spring", stiffness: 360, damping: 36, mass: 0.8 }
              }
              className="absolute inset-y-0 left-0 flex w-[min(86%,320px)] flex-col border-r border-zinc-200 bg-white shadow-2xl shadow-zinc-900/10"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                <span className="text-sm font-semibold text-zinc-900">
                  Navigation
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation"
                  className="-mr-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-3">
                {groups.map((group, gi) => (
                  <div key={group.label} className="mb-4">
                    <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      {group.label}
                    </p>
                    <ul className="space-y-0.5">
                      {group.items.map((item, ii) => {
                        const Icon = item.icon;
                        const tokens = getPalette(item.href);
                        const isActive = pathname === item.href;
                        const isFirst = gi === 0 && ii === 0;
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
                        return (
                          <li key={item.label}>
                            <Link
                              ref={isFirst ? firstLinkRef : undefined}
                              href={item.href}
                              className={`group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                isActive ? "bg-zinc-100" : "hover:bg-zinc-100"
                              } ${tokens.pageEyebrow}`}
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
              <div className="border-t border-zinc-200 px-3 py-3">
                <div className="mb-2 px-3">
                  <p className="text-[11px] text-zinc-500">Signed in as</p>
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {signedInEmail}
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
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
