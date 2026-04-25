import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#FAFAFA",
          secondary: "#F1F5F9",
          tertiary: "#E2E8F0",
          card: "rgba(255,255,255,1)",
        },
        accent: {
          blue: "#3b82f6",
          cyan: "#0891b2",
          violet: "#7c3aed",
          glow: "rgba(59,130,246,0.12)",
        },
        text: {
          primary: "#0f172a",
          secondary: "#475569",
          muted: "#94a3b8",
        },
        border: {
          subtle: "rgba(0,0,0,0.06)",
          hover: "rgba(0,0,0,0.12)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-outfit)", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      fontSize: {
        "hero": "clamp(2.5rem, 8vw, 7.5rem)",
        "hero-sub": "clamp(1rem, 2vw, 1.35rem)",
        "section": "clamp(2rem, 5vw, 3.75rem)",
      },
      animation: {
        "marquee": "marquee 30s linear infinite",
        "marquee-reverse": "marquee-reverse 30s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "float-delay": "float 6s ease-in-out 2s infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "spin-slow": "spin 20s linear infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
        "grid-fade": "grid-fade 3s ease-in-out infinite",
        "blob-drift": "blob-drift 20s ease-in-out infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(2deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "grid-fade": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.6" },
        },
        "blob-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1) rotate(0deg)" },
          "33%": { transform: "translate(30px, -20px) scale(1.1) rotate(120deg)" },
          "66%": { transform: "translate(-20px, 15px) scale(0.95) rotate(240deg)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-mesh": "linear-gradient(135deg, #60a5fa 0%, #22d3ee 25%, #a78bfa 50%, #60a5fa 75%, #22d3ee 100%)",
      },
      backgroundSize: {
        "300%": "300% 300%",
      },
      boxShadow: {
        "glow-blue": "0 0 30px rgba(59,130,246,0.25), 0 0 60px rgba(59,130,246,0.08)",
        "glow-cyan": "0 0 30px rgba(8,145,178,0.25), 0 0 60px rgba(8,145,178,0.08)",
        "glow-violet": "0 0 30px rgba(124,58,237,0.25)",
        "card": "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
