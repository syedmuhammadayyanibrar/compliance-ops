import React from "react";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "purple";

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
  status?: string;
  severity?: string;
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
  dot = false,
  status,
  severity,
}: BadgeProps) {
  // If status is provided, compute variant and label
  if (status) {
    const s = status.toUpperCase();
    let badgeVariant: BadgeVariant = "neutral";
    let showDot = true;

    if (
      s === "PASS" ||
      s === "COMPLETED" ||
      s === "OPERATIONAL" ||
      s === "VERIFIED" ||
      s === "APPROVED" ||
      s === "PASSED"
    ) {
      badgeVariant = "success";
    } else if (
      s === "PARTIAL" ||
      s === "AWAITING_APPROVAL" ||
      s === "REVIEW REQUIRED" ||
      s === "WARNING"
    ) {
      badgeVariant = "warning";
    } else if (
      s === "FAIL" ||
      s === "FAILED" ||
      s === "REJECTED" ||
      s === "CRITICAL" ||
      s === "BLOCKED"
    ) {
      badgeVariant = "danger";
    } else if (s === "RUNNING" || s === "INVESTIGATING") {
      badgeVariant = "info";
    }

    return (
      <Badge
        variant={badgeVariant}
        size={size}
        dot={showDot}
        className={className}
      >
        {status.replace(/_/g, " ")}
      </Badge>
    );
  }

  // If severity is provided, compute variant and label
  if (severity) {
    const s = severity.toUpperCase();
    let badgeVariant: BadgeVariant = "neutral";
    if (s === "CRITICAL") badgeVariant = "danger";
    else if (s === "HIGH") badgeVariant = "warning";
    else if (s === "MEDIUM") badgeVariant = "info";

    return (
      <Badge
        variant={badgeVariant}
        size="sm"
        dot={s === "CRITICAL" || s === "HIGH"}
        className={className}
      >
        {severity}
      </Badge>
    );
  }

  const variantStyles: Record<BadgeVariant, string> = {
    success: "bg-status-success-bg text-status-success border-[#C6F0DD]",
    warning: "bg-status-warning-bg text-[#B45309] border-[#FDE68A]",
    danger: "bg-status-danger-bg text-status-danger border-[#F8B4B8]",
    info: "bg-status-info-bg text-status-info border-[#BAE6FD]",
    neutral: "bg-surface-subtle text-tx-secondary border-surface-border",
    purple: "bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]",
  };

  const dotColors: Record<BadgeVariant, string> = {
    success: "bg-status-success",
    warning: "bg-status-warning",
    danger: "bg-status-danger",
    info: "bg-status-info",
    neutral: "bg-tx-muted",
    purple: "bg-[#7E22CE]",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 font-medium",
    md: "text-xs px-2.5 py-0.5 font-medium",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge status={status} />;
}

export function SeverityBadge({ severity }: { severity: string }) {
  return <Badge severity={severity} />;
}
