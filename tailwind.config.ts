import type { Config } from "tailwindcss";

// Les couleurs réelles sont injectées via des variables CSS définies
// dynamiquement depuis l'admin (section Apparence & thème).
const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        link: "var(--color-link)",
      },
      borderRadius: {
        theme: "var(--radius-base)",
      },
      fontFamily: {
        theme: "var(--font-base)",
      },
    },
  },
  plugins: [],
};

export default config;
