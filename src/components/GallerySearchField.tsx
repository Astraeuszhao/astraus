import type { FormEvent } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  placeholder?: string;
  id?: string;
  className?: string;
};

/** Uiverse-style search (alexruix), adapted for Tailwind + dark mode */
export default function GallerySearchField({
  value,
  onChange,
  onSubmit,
  placeholder = "搜索",
  id = "gallery-search",
  className = "",
}: Props) {
  return (
    <form
      onSubmit={onSubmit}
      className={`flex w-full max-w-xl items-center relative ${className}`}
    >
      <svg
        className="pointer-events-none absolute left-4 h-4 w-4 text-[#9e9ea7] dark:text-[var(--muted-foreground)]"
        aria-hidden
        viewBox="0 0 24 24"
      >
        <g>
          <path
            fill="currentColor"
            d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"
          />
        </g>
      </svg>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-lg border-2 border-transparent bg-[#f3f3f4] py-0 pl-10 pr-4 text-sm leading-7 text-[#0d0c22] outline-none transition duration-300 ease-in-out placeholder:text-[#9e9ea7] hover:border-[rgba(234,76,137,0.4)] hover:bg-white hover:shadow-[0_0_0_4px_rgb(234_76_137/0.1)] focus:border-[rgba(234,76,137,0.4)] focus:bg-white focus:shadow-[0_0_0_4px_rgb(234_76_137/0.1)] dark:bg-[var(--muted)] dark:text-[var(--foreground)] dark:placeholder:text-[var(--muted-foreground)] dark:hover:bg-[var(--card)] dark:focus:bg-[var(--card)]"
      />
    </form>
  );
}
