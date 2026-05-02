"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  addContactNote,
  createContact,
  deleteContactNote,
  getContact,
  syncContactsFromExistingSources,
  updateContact,
  type ContactRow,
  type ContactStatus,
  type ContactSource,
  type SyncResult,
} from "@/lib/services/contacts";

/* All Phase 2 mutations go through Server Actions. The dedicated API
 * route /admin/api/visitors-data (Phase 1) is the only new API route
 * in this build; everything contact-side is a Server Action so the
 * client components import these functions directly.
 *
 * Auth: each action calls requireAdmin() which throws on missing
 * session. That throw bubbles back to the caller as an action error;
 * client components surface it to the user. */

async function requireAdmin(): Promise<{ email: string }> {
  const session = await auth();
  if (!session?.user?.isAdmin || !session.user.email) {
    throw new Error("Unauthorized");
  }
  return { email: session.user.email };
}

export type CreateContactActionInput = {
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  website?: string;
  status?: ContactStatus;
  followUpDate?: string;
  source?: ContactSource;
  initialNote?: string;
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function createContactAction(
  input: CreateContactActionInput
): Promise<ActionResult<ContactRow>> {
  try {
    const admin = await requireAdmin();
    const email = input.email?.toLowerCase().trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: "Valid email required" };
    }
    const created = await createContact({
      email,
      name: input.name?.trim() || null,
      company: input.company?.trim() || null,
      phone: input.phone?.trim() || null,
      website: input.website?.trim() || null,
      status: input.status ?? "new",
      followUpDate: input.followUpDate?.trim() || null,
      source: input.source ?? "manual",
      ownerEmail: admin.email,
    });
    if (!created) {
      return {
        ok: false,
        error:
          "Could not create contact. The email may already exist.",
      };
    }
    if (input.initialNote?.trim()) {
      await addContactNote({
        contactId: created.id,
        content: input.initialNote.trim(),
        createdBy: admin.email,
        noteType: "note",
      });
    }
    revalidatePath("/admin/contacts");
    revalidatePath("/admin/relationships/pipeline");
    revalidatePath("/admin");
    return { ok: true, data: created };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export type UpdateContactPatch = Partial<{
  name: string | null;
  company: string | null;
  phone: string | null;
  website: string | null;
  status: ContactStatus;
  followUpDate: string | null;
}>;

export async function updateContactAction(
  id: number,
  patch: UpdateContactPatch
): Promise<ActionResult<ContactRow>> {
  try {
    const admin = await requireAdmin();
    const existing = await getContact(id);
    if (!existing) return { ok: false, error: "Contact not found" };

    /* Merge patch with existing record. Undefined keys keep the
     * existing value; explicit null clears the field. */
    const merged = {
      name: "name" in patch ? patch.name ?? null : existing.name,
      company: "company" in patch ? patch.company ?? null : existing.company,
      phone: "phone" in patch ? patch.phone ?? null : existing.phone,
      website: "website" in patch ? patch.website ?? null : existing.website,
      status: patch.status ?? existing.status,
      followUpDate:
        "followUpDate" in patch
          ? patch.followUpDate ?? null
          : existing.followUpDate,
    };

    const updated = await updateContact(id, merged);
    if (!updated) return { ok: false, error: "Update failed" };

    /* Auto status_change note when status changes. */
    if (patch.status && patch.status !== existing.status) {
      await addContactNote({
        contactId: id,
        content: `Status changed from '${existing.status}' to '${patch.status}'`,
        createdBy: admin.email,
        noteType: "status_change",
      });
    }

    revalidatePath("/admin/contacts");
    revalidatePath(`/admin/contacts/${id}`);
    revalidatePath("/admin/relationships/pipeline");
    revalidatePath("/admin");
    return { ok: true, data: updated };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function changeStatusAction(
  id: number,
  status: ContactStatus
): Promise<ActionResult<ContactRow>> {
  return updateContactAction(id, { status });
}

export async function addNoteAction(
  contactId: number,
  content: string
): Promise<ActionResult<true>> {
  try {
    const admin = await requireAdmin();
    const trimmed = content?.trim();
    if (!trimmed) return { ok: false, error: "Note cannot be empty" };
    const note = await addContactNote({
      contactId,
      content: trimmed,
      createdBy: admin.email,
      noteType: "note",
    });
    if (!note) return { ok: false, error: "Failed to add note" };
    revalidatePath(`/admin/contacts/${contactId}`);
    return { ok: true, data: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function deleteNoteAction(
  noteId: number,
  contactId: number
): Promise<ActionResult<true>> {
  try {
    await requireAdmin();
    const ok = await deleteContactNote(noteId, contactId);
    if (!ok) {
      return {
        ok: false,
        error: "Could not delete note (system notes cannot be removed)",
      };
    }
    revalidatePath(`/admin/contacts/${contactId}`);
    return { ok: true, data: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function syncContactsAction(): Promise<ActionResult<SyncResult>> {
  try {
    await requireAdmin();
    const result = await syncContactsFromExistingSources();
    revalidatePath("/admin/contacts");
    revalidatePath("/admin/relationships/pipeline");
    revalidatePath("/admin");
    return { ok: true, data: result };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
