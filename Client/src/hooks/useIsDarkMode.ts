import { useEffect, useState } from "react";
import { useThemeStore } from "../store/themeStore";

export function useIsDarkMode(): boolean {
  const preference = useThemeStore((state) => state.preference);
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setSystemDark(media.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  return preference === "dark" || (preference === "system" && systemDark);
}
