import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#05050a",
        panel: "#0c1322",
        line: "rgba(255, 255, 255, 0.1)",
        cyan: "#00f0ff",
        forge: "#3b82f6",
        ink: "#f8fafc",
        muted: "#94a3b8",
        success: "#10b981",
        warning: "#f59e0b",
      },
      fontFamily: {
        mono: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        grid: "radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "26px 26px",
      },
    },
  },
  plugins: [],
};
export default config;
