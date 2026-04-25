#!/usr/bin/env bash
# dbj-context.sh -- assemble the DBJ Technologies / Pathlight context pack
# and copy it to the macOS clipboard for pasting into Claude.ai portal chat.
#
# Triggered by the `dbjcontext` zsh alias. Path-independent: cd's to the repo
# root regardless of where the user runs it from.
#
# Pack contents and ordering optimized for a fresh portal Claude session:
#   1. Identity   -- product-brief, business-strategy
#   2. Rules      -- CLAUDE.md, .claude/rules/*
#   3. State      -- current-state, do-not-break
#   4. History    -- decision-log, session-handoff
#   5. Forward    -- backlog
#
# Audit warnings printed at the end flag drift in the docs themselves
# (size growth, em dash creep, missing files).

set -euo pipefail

REPO_ROOT="/Users/doulosjones/Desktop/dbj-technologies 4"
cd "$REPO_ROOT"

FILES=(
  "CLAUDE.md"
  "docs/ai/product-brief.md"
  "docs/ai/business-strategy.md"
  ".claude/rules/frontend.md"
  ".claude/rules/pathlight.md"
  ".claude/rules/deployment.md"
  "docs/ai/do-not-break.md"
  "docs/ai/current-state.md"
  "docs/ai/decision-log.md"
  "docs/ai/session-handoff.md"
  "docs/ai/backlog.md"
)

MISSING=()

PACK=$(
  printf "# DBJ Technologies / Pathlight Context Pack\n"
  printf "# Generated: %s\n" "$(date '+%Y-%m-%d %H:%M %Z')"
  printf "# Source: %s\n" "$REPO_ROOT"
  printf "#\n"
  printf "# Trust this pack over training data when there is conflict.\n"
  printf "# Brand voice: first-person \"I\", not \"we\". No em dashes in copy. No agency language.\n"
  printf "# Pathlight: do not expose internals (model names, pipeline stages, vertical DB,\n"
  printf "# matching algorithms, cost per scan) on public-facing pages.\n"
  printf "# Founder: Joshua Jones. Email: joshua@dbjtechnologies.com.\n"
  for f in "${FILES[@]}"; do
    if [ -f "$f" ]; then
      printf "\n\n===== FILE: %s =====\n\n" "$f"
      cat "$f"
    else
      MISSING+=("$f")
    fi
  done
)

printf "%s" "$PACK" | pbcopy

TOTAL_BYTES=$(printf "%s" "$PACK" | wc -c | tr -d ' ')
TOTAL_KB=$(( (TOTAL_BYTES + 1023) / 1024 ))

echo "Copied DBJ context pack to clipboard (${TOTAL_KB} KB, ${#FILES[@]} files). Paste into Claude.ai chat."

WARNINGS=0

if [ "${#MISSING[@]}" -gt 0 ]; then
  echo ""
  echo "WARNING: ${#MISSING[@]} expected file(s) missing from disk:"
  for f in "${MISSING[@]}"; do
    echo "  - $f"
  done
  WARNINGS=$((WARNINGS + 1))
fi

# session-handoff.md grows every session. At ~30 KB it starts to dominate the pack;
# archive older sessions to docs/ai/history/ when this fires.
if [ -f "docs/ai/session-handoff.md" ]; then
  HANDOFF_BYTES=$(wc -c < "docs/ai/session-handoff.md" | tr -d ' ')
  HANDOFF_KB=$(( (HANDOFF_BYTES + 1023) / 1024 ))
  if [ "$HANDOFF_KB" -gt 30 ]; then
    echo ""
    echo "WARNING: session-handoff.md is ${HANDOFF_KB} KB. Consider archiving older sessions"
    echo "to docs/ai/history/ so the latest session stays prominent in the pack."
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# Em dash drift check across the whole pack. CLAUDE.md forbids em dashes in copy;
# they should not appear in internal docs either, since docs feed the chat that writes copy.
EM_DASH_HITS=$(printf "%s" "$PACK" | grep -c $'\xe2\x80\x94' || true)
if [ "$EM_DASH_HITS" -gt 0 ]; then
  echo ""
  echo "WARNING: ${EM_DASH_HITS} em dash(es) (U+2014) in the context pack. Locate with:"
  echo "  grep -rn \$'\\xe2\\x80\\x94' CLAUDE.md docs/ai/ .claude/rules/"
  WARNINGS=$((WARNINGS + 1))
fi

# dbjonestech@gmail.com is the deprecated address. Two structural references are
# expected and benign:
#   1. docs/ai/backlog.md "Completed" line documenting the migration
#   2. .claude/rules/deployment.md pre-commit grep that searches FOR the string
# Anything beyond that baseline is real drift.
EXPECTED_LEGACY_EMAIL=2
LEGACY_EMAIL_HITS=$(printf "%s" "$PACK" | grep -c "dbjonestech@gmail.com" || true)
if [ "$LEGACY_EMAIL_HITS" -gt "$EXPECTED_LEGACY_EMAIL" ]; then
  echo ""
  echo "WARNING: legacy email dbjonestech@gmail.com appears ${LEGACY_EMAIL_HITS} time(s) (baseline ${EXPECTED_LEGACY_EMAIL})."
  echo "  New reference detected. Locate with: grep -rn dbjonestech@gmail.com CLAUDE.md docs/ai/ .claude/rules/"
  WARNINGS=$((WARNINGS + 1))
elif [ "$LEGACY_EMAIL_HITS" -lt "$EXPECTED_LEGACY_EMAIL" ]; then
  echo ""
  echo "NOTE: legacy email reference count dropped (${LEGACY_EMAIL_HITS} < baseline ${EXPECTED_LEGACY_EMAIL})."
  echo "  Update EXPECTED_LEGACY_EMAIL in scripts/dbj-context.sh to the new count."
fi

if [ "$WARNINGS" -eq 0 ]; then
  echo "No drift detected. Pack is clean."
fi
