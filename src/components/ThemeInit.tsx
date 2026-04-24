import { useEffect } from "react";
import { applyThemePreference, getThemePreference } from "@/utils/theme";

export default function ThemeInit() {
  useEffect(() => {
    applyThemePreference(getThemePreference());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (getThemePreference() === "system") applyThemePreference("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return null;
}
