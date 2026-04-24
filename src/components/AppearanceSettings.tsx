import { useEffect, useState } from "react";
import type { ThemePreference } from "@/utils/theme";
import { applyThemePreference, getThemePreference, setThemePreference } from "@/utils/theme";

export default function AppearanceSettings() {
  const [pref, setPref] = useState<ThemePreference>("system");

  useEffect(() => {
    setPref(getThemePreference());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (getThemePreference() === "system") applyThemePreference("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function select(next: ThemePreference) {
    setPref(next);
    setThemePreference(next);
  }

  const btn =
    "flex-1 py-2.5 px-2 rounded-xl text-sm font-medium transition border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)]";
  const active = "ring-2 ring-[var(--primary)] border-[var(--primary)] bg-[var(--muted)]";

  return (
    <section className="mt-8">
      <h2 className="text-base font-semibold text-[var(--foreground)] mb-3">外观设置</h2>
      <div className="flex gap-2">
        <button type="button" className={`${btn} ${pref === "light" ? active : ""}`} onClick={() => select("light")}>
          浅色
        </button>
        <button type="button" className={`${btn} ${pref === "dark" ? active : ""}`} onClick={() => select("dark")}>
          深色
        </button>
        <button type="button" className={`${btn} ${pref === "system" ? active : ""}`} onClick={() => select("system")}>
          跟随系统
        </button>
      </div>
    </section>
  );
}
