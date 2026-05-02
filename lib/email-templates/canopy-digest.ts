import type { DigestData } from "@/lib/analytics/digest";

interface BuildArgs {
  data: DigestData;
  fromName: string | null;
  accentColor: string | null;
  formatCurrency: (cents: number) => string;
}

interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

const SAFE_DEFAULT_ACCENT = "#0891b2";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function escapeHtml(s: string | null | undefined): string {
  if (s === null || s === undefined) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function deltaSign(n: number): string {
  if (n > 0) return "+";
  if (n < 0) return "";
  return "+/-";
}

export function buildCanopyDigestEmail(args: BuildArgs): BuiltEmail {
  const { data, fromName, accentColor, formatCurrency } = args;
  const accent = accentColor && /^#[0-9a-fA-F]{6}$/.test(accentColor) ? accentColor : SAFE_DEFAULT_ACCENT;
  const fromLabel = fromName?.trim() || "Canopy";
  const periodStart = formatDate(data.period_start);
  const periodEnd = formatDate(data.period_end);

  const subject = `${fromLabel} weekly digest: ${periodStart} to ${periodEnd}`;

  const wonValue = data.deals_won.reduce((sum, d) => sum + d.value_cents, 0);
  const lostValue = data.deals_lost.reduce((sum, d) => sum + d.value_cents, 0);
  const pipelineDelta = data.pipeline_value_now_cents - data.pipeline_value_prior_cents;

  const headline = [
    data.deals_won.length > 0 ? `${data.deals_won.length} won (${formatCurrency(wonValue)})` : null,
    data.deals_lost.length > 0 ? `${data.deals_lost.length} lost (${formatCurrency(lostValue)})` : null,
    `${data.new_contacts.length} new contacts`,
    data.overdue_tasks.length > 0 ? `${data.overdue_tasks.length} overdue tasks` : null,
  ]
    .filter(Boolean)
    .join("  -  ");

  const sectionHeader = (title: string) =>
    `<h2 style="font-size:14px;letter-spacing:0.04em;text-transform:uppercase;color:${accent};margin:32px 0 12px 0;font-weight:600;font-family:Helvetica,Arial,sans-serif;">${escapeHtml(title)}</h2>`;

  const newContactsHtml =
    data.new_contacts.length === 0
      ? `<p style="color:#71717a;margin:0 0 8px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;">No new contacts in this period.</p>`
      : `<ul style="padding-left:18px;margin:0;color:#27272a;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;">${data.new_contacts
          .map(
            (c) =>
              `<li><strong>${escapeHtml(c.name ?? c.email)}</strong> - ${escapeHtml(c.email)} <span style="color:#a1a1aa;">(${escapeHtml(c.source)}, ${formatDate(c.created_at)})</span></li>`,
          )
          .join("")}</ul>`;

  const overdueHtml =
    data.overdue_tasks.length === 0
      ? `<p style="color:#71717a;margin:0 0 8px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;">Nothing overdue. Nice.</p>`
      : `<ul style="padding-left:18px;margin:0;color:#27272a;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;">${data.overdue_tasks
          .map(
            (t) =>
              `<li><strong>${escapeHtml(t.title)}</strong> - ${t.days_overdue}d overdue${t.contact_name ? `, ${escapeHtml(t.contact_name)}` : ""}${t.priority ? ` <span style="color:#dc2626;">[${escapeHtml(t.priority)}]</span>` : ""}</li>`,
          )
          .join("")}</ul>`;

  const wonHtml =
    data.deals_won.length === 0
      ? `<p style="color:#71717a;margin:0 0 8px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;">No wins this period.</p>`
      : `<ul style="padding-left:18px;margin:0;color:#27272a;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;">${data.deals_won
          .map(
            (d) =>
              `<li><strong>${escapeHtml(d.name)}</strong> ${formatCurrency(d.value_cents)}${d.contact_name ? `, ${escapeHtml(d.contact_name)}` : ""}</li>`,
          )
          .join("")}</ul>`;

  const lostHtml =
    data.deals_lost.length === 0
      ? ``
      : `${sectionHeader("Lost this week")}<ul style="padding-left:18px;margin:0;color:#27272a;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;">${data.deals_lost
          .map(
            (d) =>
              `<li><strong>${escapeHtml(d.name)}</strong> ${formatCurrency(d.value_cents)}${d.loss_reason ? ` <span style="color:#a1a1aa;">(${escapeHtml(d.loss_reason)})</span>` : ""}</li>`,
          )
          .join("")}</ul>`;

  const scoreHtml =
    data.score_changes.length === 0
      ? ``
      : `${sectionHeader("Pathlight score movement")}<ul style="padding-left:18px;margin:0;color:#27272a;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;">${data.score_changes
          .map(
            (s) =>
              `<li><strong>${escapeHtml(s.contact_name ?? s.contact_email)}</strong>: ${s.previous_score} -&gt; ${s.current_score} (${deltaSign(s.delta)}${Math.abs(s.delta)})</li>`,
          )
          .join("")}</ul>`;

  const pipelineLine = `<p style="color:#27272a;margin:0;font-family:Helvetica,Arial,sans-serif;font-size:14px;">Open pipeline: <strong>${formatCurrency(data.pipeline_value_now_cents)}</strong> (was ${formatCurrency(data.pipeline_value_prior_cents)}, change ${deltaSign(pipelineDelta)}${formatCurrency(Math.abs(pipelineDelta))}).</p>`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#fafafa;">
  <div style="max-width:640px;margin:0 auto;padding:32px 24px;background:#ffffff;">
    <div style="border-left:3px solid ${accent};padding-left:14px;margin-bottom:24px;">
      <p style="margin:0;color:#71717a;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(fromLabel)} digest</p>
      <h1 style="margin:6px 0 0 0;color:#18181b;font-family:Helvetica,Arial,sans-serif;font-size:22px;font-weight:600;">${escapeHtml(periodStart)} to ${escapeHtml(periodEnd)}</h1>
      <p style="margin:8px 0 0 0;color:#52525b;font-family:Helvetica,Arial,sans-serif;font-size:14px;">${escapeHtml(headline)}</p>
    </div>

    ${sectionHeader("Pipeline")}
    ${pipelineLine}

    ${sectionHeader("New contacts")}
    ${newContactsHtml}

    ${sectionHeader("Won this week")}
    ${wonHtml}

    ${lostHtml}

    ${sectionHeader("Overdue tasks")}
    ${overdueHtml}

    ${scoreHtml}

    <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0;" />
    <p style="color:#a1a1aa;font-family:Helvetica,Arial,sans-serif;font-size:11px;margin:0;">
      Sent by Canopy. Adjust schedule or pause this digest in /admin/canopy.
    </p>
  </div>
</body></html>`;

  const textLines: string[] = [
    `${fromLabel} weekly digest: ${periodStart} to ${periodEnd}`,
    headline,
    "",
    "PIPELINE",
    `Open: ${formatCurrency(data.pipeline_value_now_cents)} (was ${formatCurrency(data.pipeline_value_prior_cents)}, ${deltaSign(pipelineDelta)}${formatCurrency(Math.abs(pipelineDelta))})`,
    "",
    "NEW CONTACTS",
    ...(data.new_contacts.length === 0
      ? ["(none)"]
      : data.new_contacts.map((c) => `- ${c.name ?? c.email} <${c.email}> [${c.source}, ${formatDate(c.created_at)}]`)),
    "",
    "WON THIS WEEK",
    ...(data.deals_won.length === 0
      ? ["(none)"]
      : data.deals_won.map((d) => `- ${d.name} ${formatCurrency(d.value_cents)}${d.contact_name ? ` (${d.contact_name})` : ""}`)),
  ];

  if (data.deals_lost.length > 0) {
    textLines.push("", "LOST THIS WEEK");
    for (const d of data.deals_lost) {
      textLines.push(`- ${d.name} ${formatCurrency(d.value_cents)}${d.loss_reason ? ` (${d.loss_reason})` : ""}`);
    }
  }

  textLines.push("", "OVERDUE TASKS");
  if (data.overdue_tasks.length === 0) {
    textLines.push("(none)");
  } else {
    for (const t of data.overdue_tasks) {
      textLines.push(`- ${t.title} (${t.days_overdue}d overdue${t.contact_name ? `, ${t.contact_name}` : ""}${t.priority ? ` [${t.priority}]` : ""})`);
    }
  }

  if (data.score_changes.length > 0) {
    textLines.push("", "PATHLIGHT SCORE MOVEMENT");
    for (const s of data.score_changes) {
      textLines.push(`- ${s.contact_name ?? s.contact_email}: ${s.previous_score} -> ${s.current_score} (${deltaSign(s.delta)}${Math.abs(s.delta)})`);
    }
  }

  textLines.push("", "Adjust schedule or pause this digest in /admin/canopy.");

  return {
    subject,
    html,
    text: textLines.join("\n"),
  };
}
