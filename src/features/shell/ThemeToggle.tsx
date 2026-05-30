import { useTheme, type ThemeMode } from "./theme";
import { MoonIcon, SunIcon, MonitorIcon } from "./icons";

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();

  const Icon = () => {
    switch (theme()) {
      case "light": return <SunIcon size={18} />;
      case "dark": return <MoonIcon size={18} />;
      case "auto": return <MonitorIcon size={18} />;
    }
  };

  return (
    <button
      class="activity-bar__btn"
      onClick={cycleTheme}
      title={`Theme: ${theme()}`}
      aria-label={`Toggle theme (current: ${theme()})`}
    >
      <Icon />
    </button>
  );
}
