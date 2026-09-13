import React from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "success" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  loading = false,
  icon,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const isButtonLoading = isLoading || loading;

  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizeStyles: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-[38px] px-4 text-sm gap-2", // 36-40px per spec
    lg: "h-11 px-5 text-sm gap-2",
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      "bg-brand hover:bg-brand-hover text-white shadow-sm focus:ring-brand",
    secondary:
      "bg-white hover:bg-surface-subtle text-tx-primary border border-surface-border shadow-sm focus:ring-slate-300",
    outline:
      "bg-white hover:bg-surface-subtle text-tx-primary border border-surface-border shadow-sm focus:ring-slate-300",
    danger:
      "bg-status-danger hover:bg-[#C82333] text-white shadow-sm focus:ring-status-danger",
    success:
      "bg-status-success hover:bg-[#138A58] text-white shadow-sm focus:ring-status-success",
    ghost:
      "bg-transparent hover:bg-surface-subtle text-tx-secondary hover:text-tx-primary focus:ring-slate-300",
  };

  return (
    <button
      disabled={disabled || isButtonLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isButtonLoading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}
