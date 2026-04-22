"use client";

import dynamic from "next/dynamic";

type Props = {
  scanId: string;
  businessName: string | null;
  pathlightScore: number | null;
  suggestedChips: string[];
  calendlyUrl: string | null;
};

const AskPathlight = dynamic(
  () => import("./AskPathlight").then((m) => m.AskPathlight),
  { ssr: false }
);

export default function AskPathlightLoader(props: Props) {
  return <AskPathlight {...props} />;
}
