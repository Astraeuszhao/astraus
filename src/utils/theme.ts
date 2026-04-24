export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

export function getThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

export function resolveDark(pref: ThemePreference): boolean {
  if (pref === "dark") return true;
  if (pref === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyThemePreference(pref: ThemePreference) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolveDark(pref));
}

export function setThemePreference(pref: ThemePreference) {
  localStorage.setItem(STORAGE_KEY, pref);
  applyThemePreference(pref);
}
