"use client";

import dynamic from "next/dynamic";

const CursorCharge = dynamic(
  () =>
    import("@/components/effects/CursorCharge").then((m) => m.CursorCharge),
  { ssr: false }
);

export function CursorWrapper() {
  return <CursorCharge />;
}
