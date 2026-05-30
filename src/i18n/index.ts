import { createSignal } from "solid-js";
import { en, type Locale } from "./locales/en";
import { ja } from "./locales/ja";

const locales: Record<string, Locale> = { en, ja };

function detectLocale(): string {
  const stored = localStorage.getItem("owox-locale");
  if (stored && locales[stored]) return stored;
  const nav = navigator.language.split("-")[0];
  return locales[nav] ? nav : "en";
}

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const result = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
  return typeof result === "string" ? result : path;
}

const [currentLocale, setCurrentLocale] = createSignal(detectLocale());

export function t(key: string): string {
  const locale = locales[currentLocale()];
  return getNestedValue(locale as unknown as Record<string, unknown>, key);
}

export function setLocale(locale: string) {
  if (locales[locale]) {
    setCurrentLocale(locale);
    localStorage.setItem("owox-locale", locale);
  }
}

export function getLocale(): string {
  return currentLocale();
}

export function getAvailableLocales(): string[] {
  return Object.keys(locales);
}
