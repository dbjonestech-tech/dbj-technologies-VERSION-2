#!/bin/bash
# Check for cross-imports between (marketing) and (grade) route groups.
# Run locally: bash scripts/check-import-boundaries.sh

FAIL=0

if grep -r "from.*\(marketing\)\|import.*\(marketing\)" --include="*.tsx" --include="*.ts" app/\(grade\)/ 2>/dev/null; then
  echo "ERROR: (grade) is importing from (marketing)"
  FAIL=1
fi

if grep -r "from.*\(grade\)\|import.*\(grade\)" --include="*.tsx" --include="*.ts" app/\(marketing\)/ 2>/dev/null; then
  echo "ERROR: (marketing) is importing from (grade)"
  FAIL=1
fi

if [ $FAIL -eq 0 ]; then
  echo "Import boundaries clean."
fi

exit $FAIL
