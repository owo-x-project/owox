import { defineConfig, presetUno } from "unocss";

export default defineConfig({
  presets: [presetUno()],
  theme: {
    colors: {
      owox: {
        primary: {
          50: "#e6f2ff",
          100: "#b3d9ff",
          200: "#80bfff",
          300: "#4da6ff",
          400: "#1a8cff",
          500: "#0077cc",
          600: "#005fa3",
          700: "#004a80",
          800: "#00355c",
          900: "#002038",
        },
        accent: {
          50: "#e6fbff",
          100: "#b3f2ff",
          200: "#80eaff",
          300: "#4de1ff",
          400: "#1ad9ff",
          500: "#00c8ff",
          600: "#00a0cc",
          700: "#007899",
          800: "#005066",
          900: "#002833",
        },
        neutral: {
          50: "#f5f7fa",
          100: "#e6e9ee",
          200: "#cdd3dc",
          300: "#b4bdca",
          400: "#9aa4b2",
          500: "#7a8494",
          600: "#5c6678",
          700: "#3e485c",
          800: "#1e242c",
          900: "#171b21",
          950: "#0f1216",
        },
        danger: "#f7768e",
        warning: "#e0af68",
        success: "#9ece6a",
        info: "#7aa2f7",
      },
    },
  },
});
