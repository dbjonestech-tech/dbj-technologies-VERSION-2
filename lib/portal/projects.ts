import { getDb } from "@/lib/db";

/* Client portal data layer: client_projects + client_files queries.
 *
 * Reads scope to a client_email or project_id; the /portal/* server
 * components and admin/clients/[email]/* surfaces are the only callers.
 * Mutation helpers throw on failure (caller decides what to surface);
 * read helpers return [] on miss. */

export const PROJECT_PHASES = [
  "discovery",
  "design",
  "build",
  "review",
  "launch",
  "maintenance",
] as const;
export type ProjectPhase = (typeof PROJECT_PHASES)[number];

export const PROJECT_STATUSES = ["active", "paused", "completed"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type ProjectRow = {
  id: string;
  client_email: string;
  name: string;
  phase: ProjectPhase;
  status: ProjectStatus;
  current_milestone: string | null;
  next_deliverable: string | null;
  projected_eta: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type FileRow = {
  id: string;
  project_id: string;
  label: string;
  description: string | null;
  blob_url: string;
  blob_pathname: string;
  content_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/* Project reads */

export async function listProjectsForClient(
  email: string
): Promise<ProjectRow[]> {
  const sql = getDb();
  const e = normalizeEmail(email);
  const rows = (await sql`
    SELECT id::text, client_email, name, phase, status, current_milestone,
           next_deliverable, projected_eta::text, created_at, updated_at, completed_at
    FROM client_projects
    WHERE client_email = ${e}
    ORDER BY
      CASE status WHEN 'active' THEN 0 WHEN 'paused' THEN 1 ELSE 2 END,
      updated_at DESC
  `) as ProjectRow[];
  return rows;
}

export async function listAllActiveProjects(): Promise<ProjectRow[]> {
  const sql = getDb();
  const rows = (await sql`
    SELECT id::text, client_email, name, phase, status, current_milestone,
           next_deliverable, projected_eta::text, created_at, updated_at, completed_at
    FROM client_projects
    WHERE status = 'active'
    ORDER BY updated_at DESC
  `) as ProjectRow[];
  return rows;
}

export async function getProject(id: string): Promise<ProjectRow | null> {
  const sql = getDb();
  const rows = (await sql`
    SELECT id::text, client_email, name, phase, status, current_milestone,
           next_deliverable, projected_eta::text, created_at, updated_at, completed_at
    FROM client_projects
    WHERE id = ${id}
    LIMIT 1
  `) as ProjectRow[];
  return rows[0] ?? null;
}

/* Project mutations */

export async function createProject(args: {
  clientEmail: string;
  name: string;
  phase?: ProjectPhase;
}): Promise<ProjectRow> {
  const sql = getDb();
  const e = normalizeEmail(args.clientEmail);
  const phase = args.phase ?? "discovery";
  const rows = (await sql`
    INSERT INTO client_projects (client_email, name, phase, status)
    VALUES (${e}, ${args.name}, ${phase}, 'active')
    RETURNING id::text, client_email, name, phase, status, current_milestone,
              next_deliverable, projected_eta::text, created_at, updated_at, completed_at
  `) as ProjectRow[];
  if (!rows[0]) throw new Error("project insert returned no row");
  return rows[0];
}

export async function updateProject(args: {
  id: string;
  name: string;
  phase: ProjectPhase;
  status: ProjectStatus;
  currentMilestone: string | null;
  nextDeliverable: string | null;
  projectedEta: string | null;
}): Promise<void> {
  const sql = getDb();
  /* The /admin/clients edit form submits all fields on every save, so
   * the helper takes the full state and writes a single UPDATE. Null
   * means "clear this field"; the form sends empty strings as null. */
  await sql`
    UPDATE client_projects
    SET name = ${args.name},
        phase = ${args.phase},
        status = ${args.status},
        current_milestone = ${args.currentMilestone},
        next_deliverable = ${args.nextDeliverable},
        projected_eta = ${args.projectedEta},
        completed_at = CASE
          WHEN ${args.status} = 'completed' AND completed_at IS NULL THEN now()
          WHEN ${args.status} != 'completed' THEN NULL
          ELSE completed_at
        END,
        updated_at = now()
    WHERE id = ${args.id}
  `;
}

export async function deleteProject(id: string): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM client_projects WHERE id = ${id}`;
}

/* File reads */

export async function listFilesForProject(
  projectId: string
): Promise<FileRow[]> {
  const sql = getDb();
  const rows = (await sql`
    SELECT id::text, project_id::text, label, description, blob_url, blob_pathname,
           content_type, size_bytes, uploaded_by, uploaded_at
    FROM client_files
    WHERE project_id = ${projectId}
    ORDER BY uploaded_at DESC
  `) as FileRow[];
  return rows;
}

export async function listFilesForClient(
  email: string
): Promise<{ project: ProjectRow; files: FileRow[] }[]> {
  const projects = await listProjectsForClient(email);
  if (projects.length === 0) return [];
  const sql = getDb();
  const ids = projects.map((p) => p.id);
  const rows = (await sql`
    SELECT id::text, project_id::text, label, description, blob_url, blob_pathname,
           content_type, size_bytes, uploaded_by, uploaded_at
    FROM client_files
    WHERE project_id = ANY(${ids}::uuid[])
    ORDER BY uploaded_at DESC
  `) as FileRow[];
  return projects.map((p) => ({
    project: p,
    files: rows.filter((r) => r.project_id === p.id),
  }));
}

export async function getFile(id: string): Promise<FileRow | null> {
  const sql = getDb();
  const rows = (await sql`
    SELECT id::text, project_id::text, label, description, blob_url, blob_pathname,
           content_type, size_bytes, uploaded_by, uploaded_at
    FROM client_files
    WHERE id = ${id}
    LIMIT 1
  `) as FileRow[];
  return rows[0] ?? null;
}

/* File mutations */

export async function createFile(args: {
  projectId: string;
  label: string;
  description: string | null;
  blobUrl: string;
  blobPathname: string;
  contentType: string | null;
  sizeBytes: number | null;
  uploadedBy: string;
}): Promise<FileRow> {
  const sql = getDb();
  const rows = (await sql`
    INSERT INTO client_files
      (project_id, label, description, blob_url, blob_pathname,
       content_type, size_bytes, uploaded_by)
    VALUES (
      ${args.projectId},
      ${args.label},
      ${args.description},
      ${args.blobUrl},
      ${args.blobPathname},
      ${args.contentType},
      ${args.sizeBytes},
      ${args.uploadedBy}
    )
    RETURNING id::text, project_id::text, label, description, blob_url, blob_pathname,
              content_type, size_bytes, uploaded_by, uploaded_at
  `) as FileRow[];
  if (!rows[0]) throw new Error("file insert returned no row");
  return rows[0];
}

export async function deleteFile(id: string): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM client_files WHERE id = ${id}`;
}

/* Pretty-print helper used by both /portal and /admin/clients. */

export function phaseIndex(p: ProjectPhase): number {
  return PROJECT_PHASES.indexOf(p);
}

export function phaseLabel(p: ProjectPhase): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}
