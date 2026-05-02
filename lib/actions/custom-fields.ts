"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { recordChange } from "@/lib/canopy/audit";
import {
  CUSTOM_FIELD_KINDS,
  getCustomFieldDefinition,
  validateCustomFieldValue,
  type CustomFieldDefinition,
  type CustomFieldEntity,
  type CustomFieldKind,
} from "@/lib/canopy/custom-fields";

export type CFActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireAdmin(): Promise<{ email: string }> {
  const session = await auth();
  if (!session?.user?.isAdmin || !session.user.email) {
    throw new Error("Unauthorized");
  }
  return { email: session.user.email };
}

const REVALIDATE_PATHS = [
  "/admin",
  "/admin/canopy",
  "/admin/contacts",
  "/admin/deals",
] as const;

function revalidateAll(): void {
  for (const p of REVALIDATE_PATHS) revalidatePath(p);
}

function canonicalizeKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export async function createCustomFieldDefinitionAction(input: {
  entityType: CustomFieldEntity;
  key?: string;
  label: string;
  kind: CustomFieldKind;
  options?: string[];
  required?: boolean;
  displayOrder?: number;
  description?: string;
}): Promise<CFActionResult<CustomFieldDefinition>> {
  try {
    await requireAdmin();
    if (!["contact", "deal"].includes(input.entityType)) {
      return { ok: false, error: "Invalid entity type" };
    }
    if (!CUSTOM_FIELD_KINDS.includes(input.kind)) {
      return { ok: false, error: "Invalid field kind" };
    }
    const label = input.label?.trim();
    if (!label) return { ok: false, error: "Label is required" };
    const key = canonicalizeKey(input.key || label);
    if (!key) return { ok: false, error: "Could not derive a key from the label" };
    const needsOptions = input.kind === "select" || input.kind === "multi_select";
    const options = needsOptions
      ? (input.options ?? []).map((o) => o.trim()).filter(Boolean)
      : null;
    if (needsOptions && (options?.length ?? 0) === 0) {
      return { ok: false, error: "Select fields require at least one option" };
    }

    const sql = getDb();
    const inserted = (await sql`
      INSERT INTO custom_field_definitions
        (entity_type, key, label, kind, options, display_order, required, description)
      VALUES (
        ${input.entityType},
        ${key},
        ${label},
        ${input.kind},
        ${options ? JSON.stringify(options) : null}::jsonb,
        ${input.displayOrder ?? 100},
        ${input.required ?? false},
        ${input.description?.trim() || null}
      )
      RETURNING id
    `) as Array<{ id: number }>;
    const id = inserted[0]?.id;
    if (!id) return { ok: false, error: "Insert failed" };
    const created = await getCustomFieldDefinition(id);
    if (!created) return { ok: false, error: "Could not reload created definition" };
    await recordChange({
      entityType: "custom_field_definition",
      entityId: String(id),
      action: "custom_field.create",
      after: { entity_type: input.entityType, key, label, kind: input.kind, required: !!input.required },
    });
    revalidateAll();
    return { ok: true, data: created };
  } catch (err) {
    const e = err instanceof Error ? err.message : "Unknown error";
    if (/duplicate key/i.test(e)) {
      return { ok: false, error: "A field with that key already exists for this entity" };
    }
    return { ok: false, error: e };
  }
}

export async function updateCustomFieldDefinitionAction(input: {
  id: number;
  label?: string;
  options?: string[];
  required?: boolean;
  displayOrder?: number;
  description?: string;
}): Promise<CFActionResult<CustomFieldDefinition>> {
  try {
    await requireAdmin();
    const before = await getCustomFieldDefinition(input.id);
    if (!before) return { ok: false, error: "Definition not found" };
    const sql = getDb();
    if (typeof input.label === "string") {
      const v = input.label.trim();
      if (!v) return { ok: false, error: "Label cannot be empty" };
      await sql`UPDATE custom_field_definitions SET label = ${v}, updated_at = NOW() WHERE id = ${input.id}`;
    }
    if (input.options !== undefined) {
      const cleaned = input.options.map((o) => o.trim()).filter(Boolean);
      const needsOptions = before.kind === "select" || before.kind === "multi_select";
      if (needsOptions && cleaned.length === 0) {
        return { ok: false, error: "Select fields require at least one option" };
      }
      await sql`UPDATE custom_field_definitions SET options = ${JSON.stringify(cleaned)}::jsonb, updated_at = NOW() WHERE id = ${input.id}`;
    }
    if (typeof input.required === "boolean") {
      await sql`UPDATE custom_field_definitions SET required = ${input.required}, updated_at = NOW() WHERE id = ${input.id}`;
    }
    if (typeof input.displayOrder === "number") {
      await sql`UPDATE custom_field_definitions SET display_order = ${input.displayOrder}, updated_at = NOW() WHERE id = ${input.id}`;
    }
    if (typeof input.description === "string") {
      await sql`UPDATE custom_field_definitions SET description = ${input.description.trim() || null}, updated_at = NOW() WHERE id = ${input.id}`;
    }
    const after = await getCustomFieldDefinition(input.id);
    if (!after) return { ok: false, error: "Could not reload definition" };
    await recordChange({
      entityType: "custom_field_definition",
      entityId: String(input.id),
      action: "custom_field.update",
      before: { label: before.label, options: before.options, required: before.required, display_order: before.display_order },
      after: { label: after.label, options: after.options, required: after.required, display_order: after.display_order },
    });
    revalidateAll();
    return { ok: true, data: after };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteCustomFieldDefinitionAction(id: number): Promise<CFActionResult> {
  try {
    await requireAdmin();
    const before = await getCustomFieldDefinition(id);
    if (!before) return { ok: false, error: "Definition not found" };
    const sql = getDb();
    /* Strip the field's stored values from any row that has it set so
     * the UI doesn't render orphan keys. JSONB minus key removes a
     * single key cleanly. */
    if (before.entity_type === "contact") {
      await sql`UPDATE contacts SET custom_fields = custom_fields - ${before.key} WHERE custom_fields ? ${before.key}`;
    } else {
      await sql`UPDATE deals SET custom_fields = custom_fields - ${before.key} WHERE custom_fields ? ${before.key}`;
    }
    await sql`DELETE FROM custom_field_definitions WHERE id = ${id}`;
    await recordChange({
      entityType: "custom_field_definition",
      entityId: String(id),
      action: "custom_field.delete",
      before: { entity_type: before.entity_type, key: before.key, label: before.label },
    });
    revalidateAll();
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function setEntityCustomFieldAction(input: {
  entityType: CustomFieldEntity;
  entityId: number;
  key: string;
  value: unknown;
}): Promise<CFActionResult> {
  try {
    await requireAdmin();
    const sql = getDb();
    const defs = (await sql`
      SELECT id, entity_type, key, label, kind, options, display_order, required, description, created_at, updated_at
      FROM custom_field_definitions
      WHERE entity_type = ${input.entityType} AND key = ${input.key}
      LIMIT 1
    `) as CustomFieldDefinition[];
    const def = defs[0];
    if (!def) return { ok: false, error: "Field definition not found" };
    const validation = validateCustomFieldValue(def, input.value);
    if (!validation.ok) return { ok: false, error: validation.error };

    const value = validation.value;
    if (input.entityType === "contact") {
      if (value === null) {
        await sql`UPDATE contacts SET custom_fields = custom_fields - ${input.key}, updated_at = NOW() WHERE id = ${input.entityId}`;
      } else {
        await sql`UPDATE contacts SET custom_fields = custom_fields || jsonb_build_object(${input.key}, ${JSON.stringify(value)}::jsonb), updated_at = NOW() WHERE id = ${input.entityId}`;
      }
    } else {
      if (value === null) {
        await sql`UPDATE deals SET custom_fields = custom_fields - ${input.key}, updated_at = NOW() WHERE id = ${input.entityId}`;
      } else {
        await sql`UPDATE deals SET custom_fields = custom_fields || jsonb_build_object(${input.key}, ${JSON.stringify(value)}::jsonb), updated_at = NOW() WHERE id = ${input.entityId}`;
      }
    }
    await recordChange({
      entityType: input.entityType,
      entityId: String(input.entityId),
      action: `custom_field.set.${input.key}`,
      after: { [input.key]: value },
    });
    revalidateAll();
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
