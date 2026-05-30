import { type Component, createSignal, For } from "solid-js";

/**
 * Accessory key bar for touch-only terminals. Provides keys that don't exist
 * on mobile soft keyboards (Tab, Esc, Ctrl+combos, arrow keys).
 *
 * Shown only on touch devices via `@media (hover: none)` in terminal.css.
 *
 * Ctrl / Alt are "sticky" modifier keys: tap to activate → next key press
 * sends the combo → modifier auto-deactivates. Tap again to cancel.
 */

/** Callback that sends raw input bytes to the terminal. */
export interface TerminalAccessoryBarProps {
  onInput: (data: string) => void;
}

interface KeyDef {
  label: string;
  /** Raw data to send. If absent, the key is a modifier toggle. */
  data?: string;
  /** CSS modifier class. */
  cls?: string;
}

const MODIFIER_KEYS = ["Ctrl", "Alt"] as const;
type Modifier = (typeof MODIFIER_KEYS)[number];

const SHORTCUT_KEYS: { label: string; data: string }[] = [
  { label: "C-c", data: "\x03" },
  { label: "C-d", data: "\x04" },
  { label: "C-z", data: "\x1A" },
];

const ARROW_KEYS: { label: string; data: string }[] = [
  { label: "↑", data: "\x1b[A" },
  { label: "↓", data: "\x1b[B" },
  { label: "→", data: "\x1b[C" },
  { label: "←", data: "\x1b[D" },
];

const BASE_KEYS: KeyDef[] = [
  { label: "Tab", data: "\t" },
  { label: "Esc", data: "\x1b" },
];

export const TerminalAccessoryBar: Component<TerminalAccessoryBarProps> = (
  props,
) => {
  const [activeModifier, setActiveModifier] = createSignal<Modifier | null>(
    null,
  );

  function handleModifier(mod: Modifier) {
    setActiveModifier((prev) => (prev === mod ? null : mod));
  }

  function handleKey(data: string) {
    const mod = activeModifier();
    if (mod === "Ctrl") {
      // Ctrl + key: send as control character (key & 0x1f).
      const ch = data.length === 1 ? data.toLowerCase() : null;
      if (ch && ch >= "a" && ch <= "z") {
        props.onInput(String.fromCharCode(ch.charCodeAt(0) - 96));
      } else {
        props.onInput(data);
      }
    } else if (mod === "Alt") {
      // Alt + key: send ESC prefix.
      props.onInput(`\x1b${data}`);
    } else {
      props.onInput(data);
    }
    setActiveModifier(null);
  }

  return (
    <div class="terminal-accessory-bar">
      <For each={BASE_KEYS}>
        {(key) => (
          <button
            type="button"
            class="terminal-accessory-bar__key"
            onPointerDown={(e) => {
              e.preventDefault();
              if (key.data) handleKey(key.data);
            }}
          >
            {key.label}
          </button>
        )}
      </For>

      <For each={MODIFIER_KEYS}>
        {(mod) => (
          <button
            type="button"
            class="terminal-accessory-bar__key"
            classList={{
              "terminal-accessory-bar__key--active": activeModifier() === mod,
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              handleModifier(mod);
            }}
          >
            {mod}
          </button>
        )}
      </For>

      <For each={ARROW_KEYS}>
        {(key) => (
          <button
            type="button"
            class="terminal-accessory-bar__key"
            onPointerDown={(e) => {
              e.preventDefault();
              handleKey(key.data);
            }}
          >
            {key.label}
          </button>
        )}
      </For>

      <div class="terminal-accessory-bar__separator" />

      <For each={SHORTCUT_KEYS}>
        {(key) => (
          <button
            type="button"
            class="terminal-accessory-bar__key terminal-accessory-bar__key--shortcut"
            onPointerDown={(e) => {
              e.preventDefault();
              props.onInput(key.data);
              setActiveModifier(null);
            }}
          >
            {key.label}
          </button>
        )}
      </For>
    </div>
  );
};
