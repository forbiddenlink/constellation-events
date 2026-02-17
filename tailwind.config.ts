import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"] ,
  theme: {
    extend: {
      colors: {
        "midnight": "#020204", // Deeper black for high contrast
        "deep-space": "#050A14", // Richer dark blue-black
        "nebula": "#0F172A", // Dark slate
        "starlight": "#F1F5F9", // Crisp white-blue
        "aurora": "#38BDF8", // Electric Sky Blue (Cyan-like)
        "comet": "#818CF8", // Indigo-Purple
        "ember": "#F472B6", // Pink-Rose for accents
        "void": "#000000" // Absolute black
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"] // Added for technical data
      },
      boxShadow: {
        glow: "0 0 80px rgba(56, 189, 248, 0.15)",
        "glass-sm": "0 4px 30px rgba(0, 0, 0, 0.1)",
        "glass-md": "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
        cinematic: "0 20px 60px -10px rgba(0, 0, 0, 0.7)",
        "hud-light": "0 0 10px rgba(56, 189, 248, 0.5)", // New HUD glow
        "hud-strong": "0 0 20px rgba(56, 189, 248, 0.8)"
      },
      backgroundImage: {
        "nebula-gradient": "radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.15), transparent 60%), radial-gradient(circle at 80% 20%, rgba(129, 140, 248, 0.15), transparent 50%), linear-gradient(180deg, #020204 0%, #050A14 100%)",
        "glass-gradient": "linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)",
        "border-gradient": "linear-gradient(to bottom right, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.02))",
        "scanlines": "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2))"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" }
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" }
        },
        scan: {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "0% 100%" }
        },
        "scan-vertical": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" }
        }
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        pulseSoft: "pulseSoft 4s ease-in-out infinite",
        shimmer: "shimmer 8s linear infinite",
        scan: "scan 4s linear infinite",
        "scan-slow": "scan-vertical 3s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
