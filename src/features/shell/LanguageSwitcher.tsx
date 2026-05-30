import { getAvailableLocales, getLocale, setLocale } from "../../i18n";
import { LanguagesIcon } from "./icons";

export function LanguageSwitcher() {
  const toggle = () => {
    const locales = getAvailableLocales();
    const current = locales.indexOf(getLocale());
    const next = locales[(current + 1) % locales.length];
    setLocale(next);
  };

  return (
    <button
      type="button"
      class="activity-bar__btn"
      onClick={toggle}
      title={`Language: ${getLocale().toUpperCase()}`}
      aria-label="Toggle language"
    >
      <LanguagesIcon size={18} />
    </button>
  );
}
