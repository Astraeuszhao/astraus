import React from "react";
import { FaSpinner } from "react-icons/fa";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  success?: boolean;
  loadingMessage?: string;
  successMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  variant?: "primary" | "secondary" | "destructive" | "outline";
};

const variantClasses: Record<string, string> = {
  primary:
    "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 hover:scale-105 hover:shadow-md",
  secondary:
    "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]/90 hover:scale-105 hover:shadow-md",
  outline:
    "border border-[var(--input)] bg-[var(--background)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] hover:scale-105 hover:border-[var(--primary)]/70 hover:shadow-sm",
  ghost:
    "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] hover:scale-105",
  destructive:
    "bg-[var(--destructive)] text-white hover:bg-[var(--destructive)]/90 hover:scale-105 hover:shadow-md",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      loading = false,
      success = false,
      loadingMessage,
      successMessage,
      disabled,
      leftIcon,
      rightIcon,
      className = "",
      fullWidth = false,
      variant = "primary",
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading || success}
      className={`
        flex items-center justify-center gap-2 px-4 py-2 rounded font-semibold transition
        disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer
        ${fullWidth ? "w-full" : ""}
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <FaSpinner className="animate-spin" />
          {loadingMessage || children}
        </>
      ) : success ? (
        successMessage || children
      ) : (
        <>
          {leftIcon && <span className="mr-1">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-1">{rightIcon}</span>}
        </>
      )}
    </button>
  )
);

Button.displayName = "Button";
export default Button;