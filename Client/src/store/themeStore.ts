import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const prefersDark = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

const applyTheme = (preference: ThemePreference) => {
  const isDark = preference === "dark" || (preference === "system" && prefersDark());
  document.documentElement.classList.toggle("dark", isDark);
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: "system",
      setPreference: (preference) => {
        applyTheme(preference);
        set({ preference });
      },
    }),
    {
      name: "bestprice-theme",
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.preference ?? "system");
      },
    }
  )
);

// Keep in sync with OS-level changes while "system" is selected.
if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (useThemeStore.getState().preference === "system") {
      applyTheme("system");
    }
  });
}
