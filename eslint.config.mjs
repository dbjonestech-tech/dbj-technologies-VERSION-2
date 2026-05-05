import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/* ESLint 9 flat config. Imports the core-web-vitals preset directly
 * from eslint-config-next 16, which ships as a flat-config array
 * (no FlatCompat bridge needed).
 *
 * Disabled rule rationale:
 *
 *  - react/no-unescaped-entities, @next/next/no-img-element: parity
 *    with the previous .eslintrc.json before the F4 bump.
 *
 *  - react-hooks v7 React Compiler diagnostics (set-state-in-effect,
 *    static-components, refs, immutability, error-boundaries, purity,
 *    rules-of-hooks for compiler context) are disabled pending the
 *    follow-up audit tracked in docs/ai/backlog.md ("Audit react-hooks
 *    v7 / React Compiler diagnostics"). Many flagged sites are the
 *    documented setMounted(true) SSR-safety pattern; clearing the
 *    list cleanly is its own task, not a security-patch side-effect.
 */

const config = [
  ...nextCoreWebVitals,
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/error-boundaries": "off",
      "react-hooks/purity": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      ".vercel/**",
      ".lighthouseci/**",
      "node_modules/**",
      "coverage/**",
      "next-env.d.ts",
      "tsconfig.tsbuildinfo",
    ],
  },
];

export default config;
