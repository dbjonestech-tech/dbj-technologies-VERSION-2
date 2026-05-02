-- Phase 5: Automation - Sequences, Workflow Rules, Bulk Actions.
--
-- Four tables that pair with lib/canopy/automation/* services and
-- the new sequence.advance + workflow.evaluate Inngest crons:
--
--   sequences           - configured drip campaigns (name, status,
--                         enrollment filter, exit conditions)
--   sequence_steps      - ordered steps per sequence with kind
--                         discriminator (email|task|wait|tag|
--                         stage_change) and a delay before the
--                         step fires
--   sequence_enrollments- per-(sequence, contact) state machine row
--                         tracking current step + next_run_at
--   workflow_rules      - trigger -> conditions -> actions tuples
--                         that fire when their named domain event
--                         appears in canopy_audit_log
--   workflow_evaluations- ledger so a rule fires at most once per
--                         audit_log row, even on cron retries

CREATE TABLE IF NOT EXISTS sequences (
  id                  BIGSERIAL    PRIMARY KEY,
  name                TEXT         NOT NULL,
  description         TEXT,
  status              TEXT         NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  enrollment_filter   JSONB        NOT NULL DEFAULT '{}'::jsonb,
  exit_conditions     JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_by_email    TEXT,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sequences_status_idx ON sequences(status);

CREATE TABLE IF NOT EXISTS sequence_steps (
  id            BIGSERIAL    PRIMARY KEY,
  sequence_id   BIGINT       NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  step_order    INT          NOT NULL,
  kind          TEXT         NOT NULL
    CHECK (kind IN ('email', 'task', 'wait', 'tag', 'stage_change')),
  payload       JSONB        NOT NULL DEFAULT '{}'::jsonb,
  delay_seconds INT          NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (sequence_id, step_order)
);

CREATE INDEX IF NOT EXISTS sequence_steps_seq_idx
  ON sequence_steps(sequence_id, step_order);

CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id                  BIGSERIAL    PRIMARY KEY,
  sequence_id         BIGINT       NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  contact_id          BIGINT       NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  current_step_order  INT          NOT NULL DEFAULT 0,
  status              TEXT         NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'exited')),
  exit_reason         TEXT,
  next_run_at         TIMESTAMPTZ,
  enrolled_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_step_at        TIMESTAMPTZ,
  UNIQUE (sequence_id, contact_id)
);

-- Cron drains "active enrollments where next_run_at <= NOW()"; this
-- partial index keeps that scan cheap.
CREATE INDEX IF NOT EXISTS sequence_enrollments_due_idx
  ON sequence_enrollments(next_run_at)
  WHERE status = 'active' AND next_run_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS sequence_enrollments_contact_idx
  ON sequence_enrollments(contact_id);

CREATE TABLE IF NOT EXISTS workflow_rules (
  id                  BIGSERIAL    PRIMARY KEY,
  name                TEXT         NOT NULL,
  description         TEXT,
  trigger_event       TEXT         NOT NULL
    CHECK (trigger_event IN (
      'contact.created',
      'deal.create',
      'deal.stage_change',
      'deal.close.won',
      'deal.close.lost',
      'activity.task.complete',
      'tag.add',
      'pathlight.rescan.trigger'
    )),
  conditions          JSONB        NOT NULL DEFAULT '{}'::jsonb,
  actions             JSONB        NOT NULL DEFAULT '[]'::jsonb,
  enabled             BOOLEAN      NOT NULL DEFAULT FALSE,
  last_evaluated_at   TIMESTAMPTZ,
  last_audit_log_id   BIGINT       NOT NULL DEFAULT 0,
  fire_count          INT          NOT NULL DEFAULT 0,
  created_by_email    TEXT,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workflow_rules_enabled_idx
  ON workflow_rules(enabled, trigger_event)
  WHERE enabled = TRUE;

CREATE TABLE IF NOT EXISTS workflow_evaluations (
  id            BIGSERIAL    PRIMARY KEY,
  rule_id       BIGINT       NOT NULL REFERENCES workflow_rules(id) ON DELETE CASCADE,
  audit_log_id  BIGINT       NOT NULL,
  fired         BOOLEAN      NOT NULL,
  reason        TEXT,
  evaluated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (rule_id, audit_log_id)
);

CREATE INDEX IF NOT EXISTS workflow_evaluations_rule_idx
  ON workflow_evaluations(rule_id, evaluated_at DESC);
