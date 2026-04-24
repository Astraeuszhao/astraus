import { GALLERY_TAG_LABELS } from "@/constants/galleryFilters";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  max?: number;
};

/** 与首页分类一致的 #标签 多选 */
export default function TagChipsPicker({ value, onChange, disabled, max = 8 }: Props) {
  function toggle(label: string) {
    if (disabled) return;
    if (value.includes(label)) {
      onChange(value.filter((x) => x !== label));
    } else if (value.length < max) {
      onChange([...value, label]);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-[var(--muted-foreground)]">
        标签 <span className="text-[var(--foreground)]">#</span> 与公开画廊分类一致，点选即可（最多 {max} 个，可不选）
      </p>
      <div className="flex flex-wrap gap-2">
        {GALLERY_TAG_LABELS.map((label) => {
          const on = value.includes(label);
          return (
            <button
              key={label}
              type="button"
              disabled={disabled || (!on && value.length >= max)}
              onClick={() => toggle(label)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium border transition ${
                on
                  ? "border-[rgba(234,76,137,0.5)] bg-[rgba(234,76,137,0.12)] text-[#0d0c22] dark:text-[var(--foreground)]"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-45"
              }`}
            >
              #{label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
