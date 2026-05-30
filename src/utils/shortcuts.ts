import { isMac } from "./platform";

export interface ShortcutDef {
  key: string;
  mod?: "primary" | "alt" | "shift" | "primary+shift";
}

export function formatShortcut(def: ShortcutDef): string {
  const mac = isMac();
  const parts: string[] = [];

  if (def.mod) {
    switch (def.mod) {
      case "primary":
        parts.push(mac ? "⌘" : "Ctrl+");
        break;
      case "alt":
        parts.push(mac ? "⌥" : "Alt+");
        break;
      case "shift":
        parts.push(mac ? "⇧" : "Shift+");
        break;
      case "primary+shift":
        parts.push(mac ? "⌘⇧" : "Ctrl+Shift+");
        break;
    }
  }

  parts.push(def.key.toUpperCase());
  return parts.join("");
}

export const SHORTCUTS = {
  commandPalette: { key: "k", mod: "primary" as const },
  save: { key: "s", mod: "primary" as const },
  newTerminal: { key: "n", mod: "primary+shift" as const },
  help: { key: "?", mod: undefined },
  toggleTheme: { key: "t", mod: "primary+shift" as const },
};
