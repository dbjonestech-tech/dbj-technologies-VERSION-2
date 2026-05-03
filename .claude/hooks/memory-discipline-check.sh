#!/usr/bin/env bash
# Memory discipline forcing function.
#
# Hooked via UserPromptSubmit in .claude/settings.json. Fires on every
# user prompt; emits a reminder ONLY when the prompt contains a session
# close signal. The reminder is captured by Claude Code as additional
# context Claude must address before responding.
#
# This exists because the assistant has historically been "lax" about
# end-of-session memory writes (per feedback_memory_discipline.md). The
# discipline does not happen reliably without a forcing function in the
# harness; this script is that function.

set -euo pipefail

INPUT="$(cat)"

# Extract the prompt field from the hook's stdin JSON. Tries python3
# (always present on macOS), falls back to a permissive regex on the
# raw input so the hook never breaks Claude Code if python3 is missing.
PROMPT=""
if command -v python3 >/dev/null 2>&1; then
  PROMPT="$(printf '%s' "$INPUT" | python3 -c 'import json,sys
try:
  print(json.load(sys.stdin).get("prompt",""))
except Exception:
  pass' 2>/dev/null || true)"
fi
if [ -z "$PROMPT" ]; then
  PROMPT="$INPUT"
fi

# Compute the memory directory dynamically from the project path so this
# hook keeps working if the repo ever moves. Claude Code encodes the
# project path by replacing / and space with - and prepending a leading
# - (from the leading / on absolute paths).
PROJECT_PATH="$(pwd)"
ENCODED="$(printf '%s' "$PROJECT_PATH" | sed 's|/|-|g; s| |-|g')"
MEMORY_DIR="$HOME/.claude/projects/${ENCODED}/memory"

# Broad regex: bias toward false positives. An extra reminder is cheap;
# a missed session-close is the failure mode this hook prevents.
PATTERN='end[- ]?session|good[ -]?night|let.?s (stop|wrap|call it)|that.?s (it|enough) (for (today|now)|for the (day|night))?|wrap (it |this )?up|done for (today|the day|the night|now)|signing off|calling it|we.?re done|i.?m done|good for (now|today|the day)|that.?ll do|stopping for|out for the (day|night)|see you (tomorrow|later)|talk (tomorrow|later)'

if echo "$PROMPT" | grep -qiE "$PATTERN"; then
  cat <<EOF

[memory-discipline-check] Session-close signal detected. Before responding, do this in order:

1. Re-read MEMORY.md and every linked memory file in
   ${MEMORY_DIR}/.

2. Identify any new conventions, commands, preferences, corrections, or
   confirmed-non-obvious choices from this session that are NOT already
   memorialized. Examples that count:
   - A new shell alias or slash command Joshua introduced
   - A new naming convention or file-location convention
   - A correction to something I did wrong this session
   - An unusual approach Joshua confirmed was right
   - A new preference about response shape, tone, or format
   - A stale memory that contradicts something Joshua said today

3. For each:
   (a) Write or update the memory file inline NOW, then add or update
       the MEMORY.md index entry, OR
   (b) Explicitly state "no new memories needed: <one-sentence reason>".

4. THEN proceed with the docs/ai/session-handoff.md update, commit, and
   push that the project's session-handoff workflow requires.

Skipping this is the exact failure mode that cost an hour of frustration
on the dbjcontext alias today. The hook exists to prevent that pattern.
EOF
fi

exit 0
