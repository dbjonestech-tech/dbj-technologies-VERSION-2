"use client";

import dynamic from "next/dynamic";

const ParticleField = dynamic(
  () =>
    import("@/components/effects/ParticleField").then((m) => m.ParticleField),
  { ssr: false }
);

const LightningCrackle = dynamic(
  () =>
    import("@/components/effects/LightningCrackle").then(
      (m) => m.LightningCrackle
    ),
  { ssr: false }
);

export function GradeEffects() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[5] overflow-hidden [&_canvas]:!pointer-events-none"
    >
      <ParticleField />
      <LightningCrackle active fadeOut={false} />
    </div>
  );
}
