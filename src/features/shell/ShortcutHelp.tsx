import { For, Show } from "solid-js";
import { t } from "../../i18n";
import {
  formatShortcut,
  SHORTCUTS,
  type ShortcutDef,
} from "../../utils/shortcuts";

interface ShortcutCategory {
  label: string;
  items: { label: string; shortcut: ShortcutDef }[];
}

function getCategories(): ShortcutCategory[] {
  return [
    {
      label: t("shortcuts.general"),
      items: [
        {
          label: t("shortcuts.commandPalette"),
          shortcut: SHORTCUTS.commandPalette,
        },
        { label: t("shortcuts.toggleTheme"), shortcut: SHORTCUTS.toggleTheme },
        { label: t("shortcuts.help"), shortcut: SHORTCUTS.help },
      ],
    },
    {
      label: t("shortcuts.terminalCategory"),
      items: [
        { label: t("shortcuts.newTerminal"), shortcut: SHORTCUTS.newTerminal },
      ],
    },
    {
      label: t("shortcuts.editorCategory"),
      items: [{ label: t("shortcuts.save"), shortcut: SHORTCUTS.save }],
    },
  ];
}

export interface ShortcutHelpProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutHelp(props: ShortcutHelpProps) {
  return (
    <Show when={props.open}>
      <div class="shortcut-help__overlay">
        <button
          type="button"
          class="shortcut-help__backdrop"
          onClick={props.onClose}
        />
        <div class="shortcut-help">
          <div class="shortcut-help__header">
            <h2>{t("shortcuts.help")}</h2>
            <button
              type="button"
              class="button button--icon"
              onClick={props.onClose}
            >
              ×
            </button>
          </div>
          <div class="shortcut-help__body">
            <For each={getCategories()}>
              {(category) => (
                <div class="shortcut-help__category">
                  <h3 class="shortcut-help__category-label">
                    {category.label}
                  </h3>
                  <For each={category.items}>
                    {(item) => (
                      <div class="shortcut-help__item">
                        <span>{item.label}</span>
                        <kbd class="shortcut-help__kbd">
                          {formatShortcut(item.shortcut)}
                        </kbd>
                      </div>
                    )}
                  </For>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </Show>
  );
}
