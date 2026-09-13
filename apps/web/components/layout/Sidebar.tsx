"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  FileText,
  Settings,
  ShieldCheck,
  Server,
  User,
  ChevronRight,
} from "lucide-react";
import { api } from "../../services/api";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);

  useEffect(() => {
    async function checkPending() {
      try {
        const data = await api.getApprovals("pending");
        setPendingApprovalsCount(data.length);
      } catch (err) {
        // Silently handle if offline
      }
    }
    checkPending();
    const interval = setInterval(checkPending, 8000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Evidence", href: "/evidence", icon: Search },
    { label: "Findings", href: "/findings", icon: AlertTriangle },
    {
      label: "Approvals",
      href: "/approvals",
      icon: CheckCircle2,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      badgeColor: "bg-status-warning text-navy-950",
    },
    { label: "Evaluations", href: "/evaluations", icon: BarChart3 },
    { label: "Reports", href: "/reports", icon: FileText },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-navy-900 border-r border-navy-800 text-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-navy-800/80 bg-navy-950/40">
        <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center text-white shadow-sm">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
            ComplianceOps
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-navy-800 text-blue-300 font-mono font-normal">
              v1.2
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            AI Governance & Compliance
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Auditing & Governance
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "bg-brand text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-navy-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-white" : "text-slate-400"
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* System Status Banner */}
      <div className="p-3 mx-3 mb-3 rounded-lg bg-navy-950/60 border border-navy-800 text-xs text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-1.5 font-medium text-slate-300 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            System Operational
          </span>
          <span className="font-mono text-[10px] text-slate-400">4/4 Connectors</span>
        </div>
        <div className="text-[10px] text-slate-500">
          Deterministic Policy Gates Active
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-navy-800/80 bg-navy-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center text-slate-300 text-xs font-semibold">
            CL
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-white truncate">
              Compliance Lead
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Nexus Technologies
            </div>
          </div>
        </div>
        <span className="w-2 h-2 rounded-full bg-status-success" title="Online" />
      </div>
    </aside>
  );
}
