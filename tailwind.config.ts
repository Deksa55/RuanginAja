import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          primary: "#087EA4",
          secondary: "#0B9AC7",
          deep: "#075985",
          light: "#E0F4FA",
          soft: "#F0FAFC",
        },
        slate: {
          primary: "#0F172A",
          secondary: "#64748B",
          border: "#E2E8F0",
        },
      },
    },
  },
  plugins: [],
};
export default config;