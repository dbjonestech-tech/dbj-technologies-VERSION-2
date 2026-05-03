"use client";

import type {
  FormDescriptor,
  FormsAuditItem,
  FormsAuditResult,
} from "@/lib/types/scan";

/**
 * Stage 2 forms audit. Renders only when the report carries a non-empty
 * forms_audit. Pairs each model-generated narrative item with the
 * descriptor it refers to (by formIndex) so the reader sees both the
 * structural facts about the form and the concrete next action.
 *
 * Copy posture: first-person "I", no em dashes, no internal terminology.
 * If the analysis call has not landed yet (status freshly flipped to
 * complete), we still render the descriptors with a quiet "Reading your
 * forms" placeholder so the section is never empty when forms exist.
 */

function summarizeFieldTypes(types: Record<string, number>): string {
  const visible = Object.entries(types).filter(([t]) => t !== "hidden");
  if (visible.length === 0) return "no visible fields";
  return visible
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([t, n]) => (n > 1 ? `${n} ${t}` : t))
    .join(", ");
}

function descriptorByIndex(
  forms: FormDescriptor[],
  formIndex: number,
): FormDescriptor | null {
  return forms.find((f) => f.formIndex === formIndex) ?? null;
}

function impactBadge(impact: FormsAuditItem["impact"]): {
  label: string;
  color: string;
} {
  if (impact === "high") return { label: "High impact", color: "#ef4444" };
  if (impact === "low") return { label: "Low impact", color: "#9aa3b2" };
  return { label: "Worth fixing", color: "#f59e0b" };
}

function FormFacts({ form }: { form: FormDescriptor }) {
  const visibleCount = form.fieldCount - form.hiddenCount;
  const summary = summarizeFieldTypes(form.fieldTypes);
  const labelGap =
    form.unlabeledCount > 0
      ? `${form.unlabeledCount} of ${visibleCount} visible fields are missing a label.`
      : null;
  const buttonLine = form.buttonCopy
    ? `Submit button reads "${form.buttonCopy}".`
    : "I could not find a clearly labeled submit button.";
  const lengthLine =
    visibleCount === 0
      ? "No visible fields detected."
      : `${visibleCount} visible field${visibleCount === 1 ? "" : "s"} (${form.requiredCount} required, ${form.optionalCount} optional). Types: ${summary}.`;

  return (
    <ul
      className="mt-2 space-y-1 text-sm"
      style={{ color: "#cbd2dc" }}
    >
      <li>{lengthLine}</li>
      <li>{buttonLine}</li>
      {labelGap ? <li>{labelGap}</li> : null}
    </ul>
  );
}

function ItemCard({
  item,
  form,
}: {
  item: FormsAuditItem;
  form: FormDescriptor | null;
}) {
  const badge = impactBadge(item.impact);
  return (
    <article
      className="rounded-2xl border p-4 print-avoid-break"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        backgroundColor: "rgba(10,12,18,0.7)",
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold" style={{ color: "#f8fafc" }}>
          {item.headline}
        </h3>
        <span
          className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider"
          style={{
            borderColor: badge.color,
            color: badge.color,
            backgroundColor: "rgba(10,12,18,0.4)",
          }}
        >
          {badge.label}
        </span>
      </div>
      {form ? <FormFacts form={form} /> : null}
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "#cbd2dc" }}>
        {item.observation}
      </p>
      <div
        className="mt-3 rounded-xl border-l-2 px-3 py-2"
        style={{
          borderColor: "rgba(34,197,94,0.6)",
          backgroundColor: "rgba(10,30,18,0.4)",
        }}
      >
        <span
          className="block text-[10px] uppercase tracking-[0.18em]"
          style={{ color: "#86efac" }}
        >
          Try this
        </span>
        <p className="mt-1 text-sm" style={{ color: "#e2e8f0" }}>
          {item.nextAction}
        </p>
      </div>
    </article>
  );
}

function PendingBlock({ forms }: { forms: FormDescriptor[] }) {
  return (
    <div className="flex flex-col gap-3">
      {forms.map((form) => (
        <article
          key={form.formIndex}
          className="rounded-2xl border p-4 print-avoid-break"
          style={{
            borderColor: "rgba(255,255,255,0.08)",
            backgroundColor: "rgba(10,12,18,0.5)",
          }}
        >
          <h3 className="text-base font-semibold" style={{ color: "#f8fafc" }}>
            {form.ariaLabel
              ? `"${form.ariaLabel}" form`
              : `Form ${form.formIndex + 1}`}
          </h3>
          <FormFacts form={form} />
          <p
            className="mt-3 text-xs italic"
            style={{ color: "#9aa3b2" }}
          >
            Reading your forms. Refresh this page in a moment for the full review.
          </p>
        </article>
      ))}
    </div>
  );
}

export function FormsAuditSection({
  formsAudit,
}: {
  formsAudit: FormsAuditResult | null;
}) {
  if (!formsAudit) return null;
  const forms = formsAudit.extracted.forms;
  if (forms.length === 0) return null;

  const items = formsAudit.analysis?.items ?? [];

  return (
    <section>
      <h2
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: "#6b7280" }}
      >
        Your forms
      </h2>
      <p
        className="mt-2 text-sm"
        style={{ color: "#9aa3b2" }}
      >
        I looked at every form on this page and flagged what is most likely
        leaking inquiries. Each item below has one concrete change you can
        make today.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <ItemCard
              key={`${item.formIndex}-${idx}`}
              item={item}
              form={descriptorByIndex(forms, item.formIndex)}
            />
          ))
        ) : (
          <PendingBlock forms={forms} />
        )}
      </div>
    </section>
  );
}
