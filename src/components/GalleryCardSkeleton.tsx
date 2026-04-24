import React from "react";

export default function GalleryCardSkeleton() {
  return (
    <div className="animate-pulse bg-[var(--card)] rounded shadow flex flex-col gap-2 p-2 min-h-[260px]">
      <div className="bg-[var(--input)] h-40 w-full rounded mb-2" />
      <div className="h-4 bg-[var(--input)] rounded w-3/4 mb-1" />
      <div className="h-3 bg-[var(--muted)] rounded w-1/2" />
    </div>
  );
}