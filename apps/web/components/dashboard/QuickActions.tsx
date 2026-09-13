"use client";

import React, { useState } from "react";
import {
  Play,
  FileCheck2,
  CheckCircle2,
  Download,
  TestTube,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../../services/api";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { LaunchAuditModal } from "../audit/LaunchAuditModal";

interface QuickActionsProps {
  pendingApprovalsCount?: number;
  onAuditStarted?: (auditId: string) => void;
  onLaunchAudit?: () => void;
}

export function QuickActions({
  pendingApprovalsCount = 0,
  onAuditStarted,
  onLaunchAudit,
}: QuickActionsProps) {
  const router = useRouter();
  const [internalModalOpen, setInternalModalOpen] = useState(false);

  const handleOpenLaunch = () => {
    if (onLaunchAudit) {
      onLaunchAudit();
    } else {
      setInternalModalOpen(true);
    }
  };

  return (
    <>
      <div className="bg-white border border-surface-border rounded-xl p-5 shadow-card flex flex-col justify-between">
        <div className="border-b border-surface-border/60 pb-3 mb-4">
          <h3 className="text-sm font-semibold text-tx-primary">
            Quick Actions & Workflows
          </h3>
          <p className="text-xs text-tx-secondary mt-0.5">
            Execute key governance routines and remediation pipelines
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Action 1: Launch Audit */}
          <button
            onClick={handleOpenLaunch}
            data-action="launch-audit"
            className="flex items-start gap-3 p-3 text-left rounded-lg border border-brand/20 bg-brand/5 hover:bg-brand/10 hover:border-brand/40 transition group"
          >
            <div className="p-2 rounded-lg bg-brand text-white shadow-sm mt-0.5 group-hover:scale-105 transition-transform">
              <Play className="w-4 h-4 fill-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-tx-primary flex items-center justify-between">
                <span>Launch New Audit</span>
                <ArrowRight className="w-3 h-3 text-brand opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-tx-secondary mt-0.5">
                Run Annex III EU AI Act compliance inspection on an AI asset
              </p>
            </div>
          </button>

          {/* Action 2: Approvals Queue */}
          <Link
            href="/approvals"
            className="flex items-start gap-3 p-3 rounded-lg border border-surface-border hover:bg-surface-subtle transition group"
          >
            <div className="p-2 rounded-lg bg-status-warning-bg text-status-warning mt-0.5 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-tx-primary flex items-center justify-between">
                <span>Triage Approvals</span>
                {pendingApprovalsCount > 0 ? (
                  <span className="text-[10px] px-1.5 py-0.5 font-bold rounded-full bg-status-warning-bg text-[#B45309]">
                    {pendingApprovalsCount} pending
                  </span>
                ) : (
                  <ArrowRight className="w-3 h-3 text-tx-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              <p className="text-[11px] text-tx-secondary mt-0.5">
                Review and gate automated writes & ticket creations
              </p>
            </div>
          </Link>

          {/* Action 3: View Evidence Ledger */}
          <Link
            href="/evidence"
            className="flex items-start gap-3 p-3 rounded-lg border border-surface-border hover:bg-surface-subtle transition group"
          >
            <div className="p-2 rounded-lg bg-surface-subtle text-tx-secondary mt-0.5 group-hover:scale-105 transition-transform">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-tx-primary flex items-center justify-between">
                <span>Evidence Ledger</span>
                <ArrowRight className="w-3 h-3 text-tx-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-tx-secondary mt-0.5">
                Inspect cross-system verified artifacts with cryptographic citations
              </p>
            </div>
          </Link>

          {/* Action 4: Run Evaluation Benchmark */}
          <Link
            href="/evaluations"
            className="flex items-start gap-3 p-3 rounded-lg border border-surface-border hover:bg-surface-subtle transition group"
          >
            <div className="p-2 rounded-lg bg-surface-subtle text-tx-secondary mt-0.5 group-hover:scale-105 transition-transform">
              <TestTube className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-tx-primary flex items-center justify-between">
                <span>Agent Evaluations</span>
                <ArrowRight className="w-3 h-3 text-tx-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-tx-secondary mt-0.5">
                Benchmark 7 deterministic test scenarios & safety metrics
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Reusable Launch Audit Modal */}
      <LaunchAuditModal
        isOpen={internalModalOpen}
        onClose={() => setInternalModalOpen(false)}
        onAuditStarted={onAuditStarted}
      />
    </>
  );
}
