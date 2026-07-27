import { IoMoonOutline, IoSunnyOutline, IoContrastOutline } from "react-icons/io5";
import { useThemeStore } from "../store/themeStore";

const order = ["light", "dark", "system"] as const;

const icons = {
  light: IoSunnyOutline,
  dark: IoMoonOutline,
  system: IoContrastOutline,
};

export function ThemeToggle() {
  const { preference, setPreference } = useThemeStore();
  const Icon = icons[preference];

  const cycle = () => {
    const next = order[(order.indexOf(preference) + 1) % order.length];
    setPreference(next);
  };

  return (
    <button
      onClick={cycle}
      aria-label={`Theme: ${preference}. Click to change.`}
      title={`Theme: ${preference}`}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-body hover:bg-surface-alt hover:text-ink transition"
    >
      <Icon size={20} />
    </button>
  );
}
