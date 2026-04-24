import { useEffect } from "react";

export default function Toast({
  message,
  type = "success",
  onClose,
}: {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-51 px-6 py-3 rounded-lg shadow-lg font-semibold
        ${
          type === "error"
? "bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5]"   // Soft red
: "bg-[#dcfce7] text-[#166534] border border-[#86efac]"   // Soft green
        }
        animate-fade-in`}
      role="alert"
      aria-live="assertive"
    >
      {message}
    </div>
  );
}