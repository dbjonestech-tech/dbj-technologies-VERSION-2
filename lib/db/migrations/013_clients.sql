-- Client portal v1: clients + their projects + their files.
-- Pairs with the white-glove DBJ engagement portal at /portal.
--
-- Three new tables (parallel to admin_users / admin_invitations from
-- migration 012) and one column added to admin_invitations so the
-- existing invitation flow can provision either admins or clients
-- depending on the invitation's role.
--
-- clients
--   Identity for paid DBJ engagement clients. Keyed by email so the
--   email allowlist on signIn is a single PK lookup. Status is
--   active/archived; archived clients keep their historical project
--   rows but are denied sign-in access. Notes is for internal use only
--   and never rendered in /portal.
--
-- client_projects
--   N projects per client. Phase is the 6-step engagement ladder
--   (discovery -> design -> build -> review -> launch -> maintenance);
--   status is active/paused/completed (orthogonal to phase). One
--   client may have multiple status='active' projects (e.g. a build
--   plus a maintenance retainer running concurrently).
--
-- client_files
--   Per-project deliverables. blob_url is a Vercel Blob URL but we
--   never hand it to the client browser; access is mediated by the
--   gated proxy at /portal/files/[id]/download which validates session
--   + ownership before streaming the bytes.
--
-- admin_invitations.role
--   Single invitation table now serves both admin and client invites.
--   The signIn callback grants entry; events.signIn dispatches to the
--   correct user table based on role.

CREATE TABLE IF NOT EXISTS clients (
  email TEXT PRIMARY KEY,
  name TEXT,
  company TEXT,
  notes TEXT,
  invited_by TEXT,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_signin_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_status
  ON clients(status, email)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS client_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_email TEXT NOT NULL REFERENCES clients(email) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'discovery' CHECK (phase IN ('discovery', 'design', 'build', 'review', 'launch', 'maintenance')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  current_milestone TEXT,
  next_deliverable TEXT,
  projected_eta DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_client_projects_client
  ON client_projects(client_email, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_projects_status
  ON client_projects(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS client_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  blob_url TEXT NOT NULL,
  blob_pathname TEXT NOT NULL,
  content_type TEXT,
  size_bytes BIGINT,
  uploaded_by TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_files_project
  ON client_files(project_id, uploaded_at DESC);

ALTER TABLE admin_invitations
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'client'));
