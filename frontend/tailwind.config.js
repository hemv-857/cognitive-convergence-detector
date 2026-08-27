/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: { 0: "#050508", 1: "#0a0a10", 2: "#0f0f18", 3: "#161622", 4: "#1e1e2e" },
        border: { DEFAULT: "#1a1a2a", h: "#252538" },
        txt: { 1: "#e8e8f0", 2: "#8585a0", 3: "#4a4a60" },
        accent: { DEFAULT: "#0ea5a5", h: "#14c8c8", d: "#088888" },
        ok: "#16a34a", err: "#dc2626", warn: "#d97706", info: "#2563eb", cyan: "#0891b2", orange: "#ea580c",
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"], mono: ["JetBrains Mono", "SF Mono", "monospace"] },
    },
  },
  plugins: [],
};
