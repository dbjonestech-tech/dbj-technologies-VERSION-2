import { PALETTES, type PaletteName } from "@/lib/admin/page-themes";

/**
 * Shared page header for every /admin/<route> page. Renders a thick
 * accent stripe, a colored chip pill (the page's palette), the page
 * title in the display font, and an optional description block.
 *
 * Each /admin page passes its assigned palette per the PAGE_PALETTE
 * map in lib/admin/page-themes.ts so the header inherits the same
 * color identity as its dashboard card. This is what makes Canopy
 * feel like a single design system across 18 pages instead of 18
 * gray pages with different content.
 *
 * Server component, no client-side state needed.
 */
export type PageHeaderProps = {
  palette: PaletteName;
  /** Section family ("Acquisition", "Operations", etc.). */
  section: string;
  /** Page name shown in the chip and as the h1. */
  pageName: string;
  /** Description paragraph under the h1. Optional. */
  description?: string;
  /** Extra content rendered below the description (filters, toolbar, etc.). */
  children?: React.ReactNode;
};

export default function PageHeader({
  palette,
  section,
  pageName,
  description,
  children,
}: PageHeaderProps) {
  const tokens = PALETTES[palette];
  return (
    <header className="relative mb-8">
      <span
        aria-hidden="true"
        className={`mb-4 block h-1.5 w-24 rounded-full ${tokens.pageStripe}`}
      />
      <span
        className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ring-1 ring-inset ${tokens.chipBg} ${tokens.pageEyebrow} ${tokens.chipRing}`}
      >
        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${tokens.dot}`} />
        {section} · {pageName}
      </span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
        {pageName}
      </h1>
      {description ? (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
          {description}
        </p>
      ) : null}
      {children}
    </header>
  );
}
