import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFile, getProject } from "@/lib/portal/projects";
import { track } from "@/lib/services/monitoring";

/* Gated proxy for client file downloads.
 *
 * The browser only ever sees /portal/files/[id]/download. This route
 * validates the session, checks ownership (admins see all; clients see
 * only their own projects), then fetches the underlying Vercel Blob URL
 * server-side and streams the bytes back. The blob URL itself never
 * reaches the client, so a leaked download link does not leak the
 * underlying public Blob URL. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function deny(status: number, message: string): Response {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = session?.user?.role;
  const accessor = session?.user?.email?.toLowerCase().trim();
  if (!session || !role || !accessor) {
    return deny(401, "Sign in required");
  }

  const { id } = await params;
  const file = await getFile(id);
  if (!file) return deny(404, "File not found");

  const project = await getProject(file.project_id);
  if (!project) return deny(404, "File not found");

  /* Authorization. Admins see everything; clients only see files
   * attached to projects they own. */
  if (role === "client" && project.client_email !== accessor) {
    return deny(403, "Forbidden");
  }
  if (role !== "admin" && role !== "client") {
    return deny(403, "Forbidden");
  }

  /* Fire-and-forget audit. A failure here must not block the
   * download, so swallow inside track() (already does). */
  await track("client.file_download", {
    fileId: file.id,
    projectId: project.id,
    role,
    accessor,
    label: file.label,
  });

  /* Stream the underlying public Blob through this server. The browser
   * never sees the Blob URL, only this gated path. */
  let blobResp: Response;
  try {
    blobResp = await fetch(file.blob_url);
  } catch (err) {
    console.warn(
      "[portal-download] blob fetch threw:",
      err instanceof Error ? err.message : String(err)
    );
    return deny(502, "Storage unreachable");
  }
  if (!blobResp.ok || !blobResp.body) {
    return deny(502, "Storage error");
  }

  const filename = sanitizeFilename(file.label);
  const headers = new Headers({
    "Content-Type": file.content_type ?? "application/octet-stream",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "private, no-store",
  });
  if (file.size_bytes) {
    headers.set("Content-Length", String(file.size_bytes));
  }
  return new Response(blobResp.body, { status: 200, headers });
}

function sanitizeFilename(label: string): string {
  /* Replace anything that breaks the Content-Disposition header value
   * with an underscore. Keeps the filename readable while preventing
   * header injection. */
  return label.replace(/["\r\n]/g, "_").slice(0, 200);
}
