import { ReactNode, useEffect, useRef } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
};

const sizeClass = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  "2xl": "max-w-4xl max-h-[90vh]",
  full: "max-w-[98vw] max-h-[98vh]",
};

export default function Modal({ open, onClose, children, title, size = "lg" }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();
    function handleTab(e: KeyboardEvent) {
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }
    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Close on outside click
  function handleBackdropClick(e: React.MouseEvent) {
    if (modalRef.current && e.target === modalRef.current) {
      onClose();
    }
  }

  if (!open) return null;
  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div className={`relative bg-[var(--card)] mx-4 md:mx-4 sm:mx-auto text-[var(--card-foreground)] p-6 rounded shadow-lg w-full ${sizeClass[size]} overflow-auto transition-all duration-200 scale-100 animate-fade-in`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl font-bold leading-none w-8 h-8 flex items-center justify-center rounded-full text-foreground/50 hover:text-primary/80 hover:bg-foreground/20 focus:outline-none cursor-pointer transition-colors"
          aria-label="关闭"
        >
          &times;
        </button>
        {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  );
}