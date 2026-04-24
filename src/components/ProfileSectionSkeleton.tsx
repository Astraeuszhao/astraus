import React from "react";

export default function ProfileSectionSkeleton() {
  return (
    <div className="max-w-md mx-auto mt-8 p-6 border rounded bg-[var(--card)] text-[var(--card-foreground)] shadow-lg">
      <div className="flex flex-col items-center mb-4">
        <div className="w-[120px] h-[120px] rounded-full bg-[var(--input)] animate-pulse mb-2" />
        <div className="h-4 w-32 bg-[var(--muted)] rounded mb-2 animate-pulse" />
      </div>
      <div className="h-4 w-20 bg-[var(--muted)] rounded mb-3 animate-pulse" />
      <div className="h-20 w-full bg-[var(--input)] rounded mb-4 animate-pulse" />
      <div className="h-10 w-full bg-[var(--input)] rounded animate-pulse" />
    </div>
  );
}