import { createSignal, Show } from "solid-js";
import { getLocale, setLocale, t } from "../../i18n";
import {
  getTerminalScrollback,
  setTerminalScrollback,
} from "../terminal/renderer";
import { MoonIcon, SunIcon } from "./icons";
import { useTheme } from "./theme";

export interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal(props: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const [scrollback, setScrollbackLocal] = createSignal(
    getTerminalScrollback(),
  );

  return (
    <Show when={props.open}>
      <div class="settings-modal__overlay">
        <button
          type="button"
          class="settings-modal__backdrop"
          onClick={props.onClose}
        />
        <div
          class="settings-modal"
          role="dialog"
          aria-modal="true"
          aria-label={t("settings.title")}
          onKeyDown={(e) => {
            if (e.key === "Escape") props.onClose();
          }}
        >
          <h2 class="settings-modal__title">{t("settings.title")}</h2>
          <p class="settings-modal__description">{t("settings.description")}</p>

          <div class="settings-modal__divider" />

          <div class="settings-modal__row">
            <div class="settings-modal__label">
              <span class="settings-modal__label-title">
                {t("settings.language")}
              </span>
              <span class="settings-modal__label-desc">
                {t("settings.languageDescription")}
              </span>
            </div>
            <div class="settings-modal__toggle-group">
              <button
                type="button"
                class="settings-modal__toggle-btn"
                classList={{
                  "settings-modal__toggle-btn--active": getLocale() === "ja",
                }}
                onClick={() => setLocale("ja")}
              >
                日本語
              </button>
              <button
                type="button"
                class="settings-modal__toggle-btn"
                classList={{
                  "settings-modal__toggle-btn--active": getLocale() === "en",
                }}
                onClick={() => setLocale("en")}
              >
                English
              </button>
            </div>
          </div>

          <div class="settings-modal__divider" />

          <div class="settings-modal__row">
            <div class="settings-modal__label">
              <span class="settings-modal__label-title">
                {t("settings.theme")}
              </span>
              <span class="settings-modal__label-desc">
                {t("settings.themeDescription")}
              </span>
            </div>
            <div class="settings-modal__toggle-group">
              <button
                type="button"
                class="settings-modal__toggle-btn"
                classList={{
                  "settings-modal__toggle-btn--active": theme() === "light",
                }}
                onClick={() => setTheme("light")}
              >
                <SunIcon size={14} />
                Light
              </button>
              <button
                type="button"
                class="settings-modal__toggle-btn"
                classList={{
                  "settings-modal__toggle-btn--active": theme() === "dark",
                }}
                onClick={() => setTheme("dark")}
              >
                <MoonIcon size={14} />
                Dark
              </button>
            </div>
          </div>

          <div class="settings-modal__divider" />

          <div class="settings-modal__row">
            <div class="settings-modal__label">
              <span class="settings-modal__label-title">
                {t("settings.terminalScrollback")}
              </span>
              <span class="settings-modal__label-desc">
                {t("settings.terminalScrollbackDescription")}
              </span>
            </div>
            <input
              type="number"
              class="settings-modal__number-input"
              min={100}
              max={100000}
              step={100}
              value={scrollback()}
              onInput={(e) => {
                const v = Number.parseInt(e.currentTarget.value, 10);
                if (Number.isFinite(v) && v > 0) {
                  setScrollbackLocal(v);
                  setTerminalScrollback(v);
                }
              }}
            />
          </div>

          <button
            type="button"
            class="settings-modal__done"
            onClick={props.onClose}
          >
            {t("settings.done")}
          </button>
        </div>
      </div>
    </Show>
  );
}
