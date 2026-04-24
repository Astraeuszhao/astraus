export default function Spinner() {
  return (
    <div className="fixed inset-0 z-51 flex items-center justify-center bg-black/20 pointer-events-none">
      <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}