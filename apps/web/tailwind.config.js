/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#081626",
          900: "#0F2742",
          800: "#18395E",
          700: "#244C78",
        },
        brand: {
          DEFAULT: "#2563EB",
          hover: "#174EA6",
          subtle: "#EFF6FF",
        },
        surface: {
          DEFAULT: "#F7F9FC",
          card: "#FFFFFF",
          border: "#E5EAF0",
          subtle: "#F1F5F9",
        },
        tx: {
          primary: "#172B3A",
          secondary: "#64748B",
          muted: "#94A3B8",
        },
        status: {
          success: "#16A36A",
          "success-bg": "#E9F8F1",
          warning: "#F59E0B",
          "warning-bg": "#FFF7E6",
          danger: "#DC3545",
          "danger-bg": "#FDECEE",
          info: "#0284C7",
          "info-bg": "#E0F2FE",
          neutral: "#64748B",
          "neutral-bg": "#F1F5F9",
        },
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(15, 39, 66, 0.04), 0 1px 2px -1px rgba(15, 39, 66, 0.02)",
        card: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.02)",
        elevated: "0 4px 6px -1px rgba(15, 39, 66, 0.07), 0 2px 4px -2px rgba(15, 39, 66, 0.05)",
      },
    },
  },
  plugins: [],
};
