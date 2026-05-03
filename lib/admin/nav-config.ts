import {
  Activity,
  AlertTriangle,
  BarChart3,
  Briefcase,
  ClipboardList,
  Database,
  DollarSign,
  Files,
  Filter,
  Globe,
  Kanban,
  Key,
  LayoutDashboard,
  Mail,
  Radar,
  Radio,
  Repeat,
  Search,
  Send,
  Server,
  Settings,
  ShieldCheck,
  Sliders,
  Sprout,
  Users,
  Workflow,
  Wifi,
  Zap,
  FileText,
} from "lucide-react";
import type { PaletteName } from "./page-themes";

/* Single source of truth for the /admin sidebar nav.
 *
 * The desktop aside in app/admin/layout.tsx and the mobile drawer in
 * app/admin/components/MobileSidebar.tsx both pull from this module
 * so that adding or reordering a nav item only happens in one place.
 *
 * Lucide icon component references are exported as-is here. Both call
 * sites are regular module imports (no RSC prop boundary crossing),
 * so the function-typed icon prop is fine. */

export type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  palette: PaletteName;
  disabled?: boolean;
  badge?: { count: number; tone: "danger" | "info" } | null;
};

export type NavGroup = { label: string; items: NavItem[] };

export function buildAdminNavGroups(overdueCount: number): NavGroup[] {
  return [
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
      label: "Relationships",
      items: [
        {
          label: "Contacts",
          href: "/admin/contacts",
          icon: ClipboardList,
          palette: "pink",
          badge: overdueCount > 0 ? { count: overdueCount, tone: "danger" } : null,
        },
        { label: "Deals", href: "/admin/deals", icon: Briefcase, palette: "violet" },
        { label: "Stage board", href: "/admin/relationships/pipeline", icon: Kanban, palette: "rose" },
      ],
    },
    {
      label: "Analytics",
      items: [
        { label: "Sales analytics", href: "/admin/analytics/pipeline", icon: BarChart3, palette: "emerald" },
      ],
    },
    {
      label: "Automation",
      items: [
        { label: "Sequences", href: "/admin/sequences", icon: Send, palette: "violet" },
        { label: "Workflow rules", href: "/admin/automations", icon: Zap, palette: "violet" },
        { label: "Email templates", href: "/admin/canopy/templates", icon: Files, palette: "violet" },
      ],
    },
    {
      label: "Pathlight Advanced",
      items: [
        { label: "Prospecting", href: "/admin/prospecting", icon: Sprout, palette: "lime" },
        { label: "Website changes", href: "/admin/website-changes", icon: Radar, palette: "lime" },
        { label: "Beacon", href: "/admin/canopy/beacon", icon: Radio, palette: "lime" },
      ],
    },
    {
      label: "Operations",
      items: [
        { label: "Tasks", href: "/admin/tasks", icon: ClipboardList, palette: "amber" },
        { label: "Monitor", href: "/admin/monitor", icon: Activity, palette: "cyan" },
        { label: "Costs", href: "/admin/costs", icon: DollarSign, palette: "amber" },
        { label: "Pathlight scans", href: "/admin/scans", icon: FileText, palette: "teal" },
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
        { label: "Canopy controls", href: "/admin/canopy", icon: Sliders, palette: "stone" },
        { label: "Team", href: "/admin/canopy/team", icon: Users, palette: "zinc" },
        { label: "API & webhooks", href: "/admin/canopy/api", icon: Key, palette: "stone" },
        { label: "Audit log", href: "/admin/audit", icon: ShieldCheck, palette: "stone" },
        { label: "Users", href: "/admin/users", icon: Users, palette: "zinc" },
        { label: "Config", href: "/admin/config", icon: Settings, palette: "teal" },
      ],
    },
  ];
}
