import React from "react";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  highlight?: "normal" | "warning" | "danger" | "success";
}

export function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  highlight = "normal",
}: KpiCardProps) {
  const highlightStyles = {
    normal: "text-tx-primary",
    warning: "text-[#B45309]",
    danger: "text-status-danger",
    success: "text-status-success",
  };

  const iconBgStyles = {
    normal: "bg-surface-subtle text-tx-secondary",
    warning: "bg-status-warning-bg text-status-warning",
    danger: "bg-status-danger-bg text-status-danger",
    success: "bg-status-success-bg text-status-success",
  };

  return (
    <div className="bg-white border border-surface-border rounded-xl p-4 sm:p-5 shadow-card flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-tx-secondary uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2 rounded-lg ${iconBgStyles[highlight]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${highlightStyles[highlight]}`}>
          {value}
        </span>

        {trend && (
          <span
            className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              trend.positive
                ? "bg-status-success-bg text-status-success"
                : "bg-status-danger-bg text-status-danger"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      <p className="text-xs text-tx-muted mt-1.5 font-normal truncate">
        {description}
      </p>
    </div>
  );
}
