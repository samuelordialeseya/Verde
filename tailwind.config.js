/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Epilogue"', "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        verde: {
          50: "#e9f9ef",
          100: "#d2f3de",
          500: "#0f8f4d",
          600: "#0a7b41",
          700: "#076236",
          900: "#07361f",
        },
      },
      boxShadow: {
        card: "0 6px 20px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
