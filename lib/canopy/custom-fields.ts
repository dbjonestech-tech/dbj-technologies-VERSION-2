import { getDb } from "@/lib/db";

export type CustomFieldKind =
  | "text"
  | "number"
  | "date"
  | "select"
  | "multi_select"
  | "checkbox"
  | "url";

export const CUSTOM_FIELD_KINDS: readonly CustomFieldKind[] = [
  "text",
  "number",
  "date",
  "select",
  "multi_select",
  "checkbox",
  "url",
];

export type CustomFieldEntity = "contact" | "deal";

export interface CustomFieldDefinition {
  id: number;
  entity_type: CustomFieldEntity;
  key: string;
  label: string;
  kind: CustomFieldKind;
  options: string[] | null;
  display_order: number;
  required: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export async function getCustomFieldDefinitions(
  entityType: CustomFieldEntity
): Promise<CustomFieldDefinition[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, entity_type, key, label, kind, options, display_order,
             required, description, created_at, updated_at
      FROM custom_field_definitions
      WHERE entity_type = ${entityType}
      ORDER BY display_order, label
    `) as CustomFieldDefinition[];
    return rows;
  } catch {
    return [];
  }
}

export async function getCustomFieldDefinition(id: number): Promise<CustomFieldDefinition | null> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, entity_type, key, label, kind, options, display_order,
             required, description, created_at, updated_at
      FROM custom_field_definitions
      WHERE id = ${id}
      LIMIT 1
    `) as CustomFieldDefinition[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/* Validate + coerce a raw value against a definition. Returns
 * { ok: true, value } on accept (where value is the canonical form),
 * { ok: false, error } on reject. Used by Server Actions before write. */
export function validateCustomFieldValue(
  def: CustomFieldDefinition,
  raw: unknown
): { ok: true; value: unknown } | { ok: false; error: string } {
  if (raw === null || raw === undefined || raw === "") {
    if (def.required) return { ok: false, error: `${def.label} is required` };
    return { ok: true, value: null };
  }
  switch (def.kind) {
    case "text":
    case "url": {
      if (typeof raw !== "string") return { ok: false, error: `${def.label} must be text` };
      const v = raw.trim();
      if (def.kind === "url" && v && !/^https?:\/\//i.test(v)) {
        return { ok: false, error: `${def.label} must start with http:// or https://` };
      }
      return { ok: true, value: v };
    }
    case "number": {
      const n = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(n)) return { ok: false, error: `${def.label} must be a number` };
      return { ok: true, value: n };
    }
    case "date": {
      if (typeof raw !== "string") return { ok: false, error: `${def.label} must be a date` };
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return { ok: false, error: `${def.label} is not a valid date` };
      return { ok: true, value: raw };
    }
    case "select": {
      if (typeof raw !== "string") return { ok: false, error: `${def.label} must be one option` };
      const options = def.options ?? [];
      if (!options.includes(raw)) return { ok: false, error: `${def.label} must be one of: ${options.join(", ")}` };
      return { ok: true, value: raw };
    }
    case "multi_select": {
      if (!Array.isArray(raw)) return { ok: false, error: `${def.label} must be a list of options` };
      const options = def.options ?? [];
      for (const v of raw) {
        if (typeof v !== "string" || !options.includes(v)) {
          return { ok: false, error: `${def.label} contains an invalid option` };
        }
      }
      return { ok: true, value: raw };
    }
    case "checkbox": {
      const v = typeof raw === "boolean" ? raw : raw === "true" || raw === "on" || raw === 1;
      return { ok: true, value: v };
    }
  }
}

/* Render a raw stored value back to a human-friendly string for
 * display lists where inline editing is not active. */
export function formatCustomFieldValue(
  def: CustomFieldDefinition,
  raw: unknown
): string {
  if (raw === null || raw === undefined || raw === "") return "-";
  switch (def.kind) {
    case "checkbox":
      return raw === true ? "Yes" : "No";
    case "multi_select":
      return Array.isArray(raw) ? raw.join(", ") : String(raw);
    case "date":
      return typeof raw === "string" ? raw : String(raw);
    case "number":
      return typeof raw === "number" ? raw.toLocaleString() : String(raw);
    default:
      return String(raw);
  }
}
