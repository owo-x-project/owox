import { createSignal } from "solid-js";

export type ThemeMode = "auto" | "light" | "dark";

const STORAGE_KEY = "owox-theme";

function getInitialTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "auto") return stored;
  return "auto";
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute("data-theme", mode);
  localStorage.setItem(STORAGE_KEY, mode);
}

const [theme, setThemeSignal] = createSignal<ThemeMode>(getInitialTheme());

// Apply initial theme immediately
applyTheme(theme());

export function useTheme() {
  return {
    theme,
    setTheme(mode: ThemeMode) {
      setThemeSignal(mode);
      applyTheme(mode);
    },
    cycleTheme() {
      const order: ThemeMode[] = ["auto", "light", "dark"];
      const current = order.indexOf(theme());
      const next = order[(current + 1) % order.length];
      setThemeSignal(next);
      applyTheme(next);
    },
  };
}
