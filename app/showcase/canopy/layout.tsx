import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Briefcase,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Sprout,
  Zap,
} from "lucide-react";
import { PALETTES } from "@/lib/admin/page-themes";

/* Public Canopy showcase shell. Mirrors the /admin layout (sidebar +
 * header + content well) without the auth gate so visitors landing
 * from the Work page can tour the product. Fixture data only; no
 * real client records are reachable from this route group. */

export const metadata: Metadata = {
  title: { default: "Canopy showcase", template: "%s | Canopy showcase" },
  description:
    "A guided tour of Canopy, the operating-system admin I built for the studio, with the first external install live for a client. Fictional data, real product.",
  robots: { index: true, follow: true },
};

const SHOWCASE_NAV = [
  {
    label: "Dashboard",
    href: "/showcase/canopy",
    icon: LayoutDashboard,
    palette: "zinc" as const,
  },
  {
    label: "Analytics",
    href: "/showcase/canopy/analytics",
    icon: BarChart3,
    palette: "sky" as const,
  },
  {
    label: "Contacts",
    href: "/showcase/canopy/contacts",
    icon: ClipboardList,
    palette: "pink" as const,
  },
  {
    label: "Deals",
    href: "/showcase/canopy/deals",
    icon: Briefcase,
    palette: "violet" as const,
  },
  {
    label: "Automation",
    href: "/showcase/canopy/automation",
    icon: Zap,
    palette: "indigo" as const,
  },
  {
    label: "Operations",
    href: "/showcase/canopy/operations",
    icon: Activity,
    palette: "cyan" as const,
  },
  {
    label: "Pathlight",
    href: "/showcase/canopy/pathlight",
    icon: Sprout,
    palette: "lime" as const,
  },
  {
    label: "Audit log",
    href: "/showcase/canopy/audit",
    icon: ShieldCheck,
    palette: "stone" as const,
  },
];

export default function ShowcaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "#FAFAFA" }}
    >
      <ShowcaseBanner />
      <div className="flex min-h-[calc(100vh-44px)]">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex">
          <div className="flex items-center border-b border-zinc-200 px-5 py-5">
            <CanopyWordmark />
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <Link
              href="/work/canopy"
              className="mb-4 flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50/40 px-3 py-2 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100 hover:border-violet-300"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Back to Canopy case study
            </Link>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Showcase tour
            </p>
            <ul className="space-y-0.5">
              {SHOWCASE_NAV.map((item) => {
                const Icon = item.icon;
                const tokens = PALETTES[item.palette];
                return (
                  <li key={item.href}>
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

            <div className="mt-8 rounded-lg border border-violet-200 bg-violet-50/60 p-3">
              <div className="flex items-center gap-1.5">
                <Sparkles
                  className="h-3.5 w-3.5 text-violet-700"
                  aria-hidden="true"
                />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-800">
                  Live demo
                </p>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-violet-900/80">
                Every record on this tour is invented. The product
                that renders them is the operating-system admin I
                built for the studio, with the first external install
                live for a client.
              </p>
              <Link
                href="/work/canopy"
                className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 hover:underline"
              >
                Read the case study
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          </nav>
          <div className="border-t border-zinc-200 px-3 py-4">
            <div className="px-3">
              <p className="text-xs text-zinc-500">Signed in as</p>
              <p className="truncate text-sm font-medium text-zinc-900">
                joshua@dbjtechnologies.com
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
                demo session
              </p>
            </div>
          </div>
          <div className="border-t border-zinc-200 px-3 py-3">
            <Link
              href="/"
              className="group flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-zinc-100"
              aria-label="Back to DBJ Technologies"
            >
              <DbjMark className="h-4 w-auto shrink-0" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-700">
                DBJ Technologies
              </span>
              <ArrowLeft className="ml-auto h-3 w-3 shrink-0 text-zinc-400 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </aside>
        <main className="flex flex-1 flex-col">
          <header className="flex min-h-14 items-center gap-3 border-b border-zinc-200 bg-white px-4 py-2 lg:hidden">
            <CanopyWordmark />
          </header>
          <div className="flex-1 overflow-x-hidden">{children}</div>
        </main>
      </div>
    </div>
  );
}

function ShowcaseBanner() {
  return (
    <div className="border-b border-violet-200 bg-violet-50/60 px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-violet-800">
      Canopy showcase · fictional data ·{" "}
      <Link
        href="/work/canopy"
        className="underline-offset-2 hover:underline"
      >
        return to /work/canopy
      </Link>
    </div>
  );
}

function DbjMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 173 213"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="DBJ Technologies"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M173 98L153 87V149L88 189L21 150V88L0 99V160L8 166L87 213H90L93 210L103 205L173 160V98ZM57 67L37 79V143L57 155H59V67H57ZM116 66V154L122 153L123 151L135 145L138 142V77L122 68L116 66ZM116 24L115 26V46L116 48L172 83L173 82V58L125 29L122 26L116 24ZM96 0L92 1L89 4L0 58V82H2L42 58L74 37L76 38V165L87 171L96 167V0Z"
        fill="#1AD4EA"
      />
    </svg>
  );
}

function CanopyWordmark() {
  return (
    <Link
      href="/showcase/canopy"
      aria-label="Canopy showcase home"
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
