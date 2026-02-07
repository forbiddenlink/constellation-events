import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"] ,
  theme: {
    extend: {
      colors: {
        "midnight": "#05060F",
        "deep-space": "#0B1020",
        "nebula": "#14213D",
        "starlight": "#E8F1FF",
        "aurora": "#5EF2C1",
        "comet": "#7B8CFF",
        "ember": "#FF8D5C"
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 60px rgba(94, 242, 193, 0.25)",
        comet: "0 0 40px rgba(123, 140, 255, 0.3)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.8" },
          "50%": { opacity: "1" }
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" }
        }
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        pulseSoft: "pulseSoft 6s ease-in-out infinite",
        shimmer: "shimmer 12s ease-in-out infinite"
      },
      backgroundImage: {
        "nebula-gradient": "radial-gradient(circle at top, rgba(94, 242, 193, 0.2), transparent 55%), radial-gradient(circle at 20% 30%, rgba(123, 140, 255, 0.2), transparent 45%), linear-gradient(160deg, #05060F 0%, #0B1020 45%, #14213D 100%)"
      }
    }
  },
  plugins: []
};

export default config;
