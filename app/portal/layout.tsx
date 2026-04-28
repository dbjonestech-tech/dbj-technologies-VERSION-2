import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signOutAction } from "@/lib/auth/actions";
import { LogOut, LayoutDashboard, FolderOpen, FileSearch, UserCircle } from "lucide-react";

export const metadata: Metadata = {
  title: { default: "Client portal", template: "%s | DBJ Client Portal" },
  robots: { index: false, follow: false, nocache: true },
};

const NAV_ITEMS: { label: string; href: string; icon: typeof LayoutDashboard }[] = [
  { label: "Project", href: "/portal", icon: LayoutDashboard },
  { label: "Files", href: "/portal/files", icon: FolderOpen },
  { label: "Scans", href: "/portal/scans", icon: FileSearch },
  { label: "Account", href: "/portal/account", icon: UserCircle },
];

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "client" && session.user.role !== "admin")) {
    redirect("/signin?callbackUrl=/portal");
  }

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#FAFAFA" }}>
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex">
          <div className="flex h-16 items-center border-b border-zinc-200 px-5">
            <Link href="/portal" aria-label="Client portal home" className="inline-flex items-center">
              <Image
                src="/brand/dbj_logo_horizontal.svg"
                alt="DBJ Technologies"
                width={130}
                height={36}
                priority
              />
            </Link>
          </div>
          <div className="px-5 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-400">
              Client portal
            </p>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {session.user.role === "admin" ? (
              <div className="mt-6 border-t border-zinc-200 pt-4">
                <p className="px-3 text-[10px] uppercase tracking-wider text-zinc-400">
                  Admin preview
                </p>
                <Link
                  href="/admin"
                  className="mt-2 block rounded-md px-3 py-2 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                >
                  Back to admin shell
                </Link>
              </div>
            ) : null}
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
            <Link href="/portal" aria-label="Client portal home" className="inline-flex items-center">
              <Image
                src="/brand/dbj_logo_horizontal.svg"
                alt="DBJ Technologies"
                width={120}
                height={32}
                priority
              />
            </Link>
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
