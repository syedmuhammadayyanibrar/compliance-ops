"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Clock,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { api } from "../../services/api";
import { ApprovalItem } from "../../types";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal State for Confirming Approval or Rejection
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [decisionType, setDecisionType] = useState<"approve" | "reject">("approve");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewerName, setReviewerName] = useState("compliance_lead@nexus.internal");
  const [decisionReason, setDecisionReason] = useState("");

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const data = await api.getApprovals();
      setApprovals(data);
    } catch (err) {
      console.error("Failed to load approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const openDecisionModal = (approval: ApprovalItem, type: "approve" | "reject") => {
    setSelectedApproval(approval);
    setDecisionType(type);
    setDecisionReason(
      type === "approve"
        ? "Verified regulatory evidence and confirmed ticket creation scope."
        : "Rejected: requires further governance review."
    );
    setIsModalOpen(true);
  };

  const handleConfirmDecision = async () => {
    if (!selectedApproval) return;
    setActionLoading(selectedApproval.id);
    try {
      await api.resolveApproval(
        selectedApproval.id,
        decisionType,
        reviewerName,
        decisionReason
      );
      setIsModalOpen(false);
      await loadApprovals();
    } catch (err) {
      console.error("Error resolving approval:", err);
      alert("Failed to resolve approval. Check backend API connection.");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingApprovals = approvals.filter((a) => a.status === "pending");
  const resolvedApprovals = approvals.filter((a) => a.status !== "pending");
  const approvedCount = resolvedApprovals.filter((a) => a.status === "approved").length;
  const rejectedCount = resolvedApprovals.filter((a) => a.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-surface-border rounded-xl p-5 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-tx-primary tracking-tight">
              Human-in-the-Loop Policy Gate
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-status-warning-bg text-status-warning border border-amber-200">
              Deterministic Dual-Key Auth
            </span>
          </div>
          <p className="text-xs sm:text-sm text-tx-secondary mt-1">
            Consequential external write operations (e.g. creating Linear remediation tickets or publishing documentation) are safely paused until authorized by a compliance officer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadApprovals}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
          >
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="text-xs font-medium text-tx-secondary uppercase">
            Pending Reviews
          </div>
          <div className="text-2xl font-bold text-[#B45309] mt-1">
            {pendingApprovals.length}
          </div>
          <div className="text-[11px] text-tx-muted mt-0.5">
            Awaiting human sign-off
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="text-xs font-medium text-tx-secondary uppercase">
            Approved & Executed
          </div>
          <div className="text-2xl font-bold text-status-success mt-1">
            {approvedCount}
          </div>
          <div className="text-[11px] text-tx-muted mt-0.5">
            Verified external actions
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="text-xs font-medium text-tx-secondary uppercase">
            Rejected Actions
          </div>
          <div className="text-2xl font-bold text-tx-secondary mt-1">
            {rejectedCount}
          </div>
          <div className="text-[11px] text-tx-muted mt-0.5">
            Interrupted or denied
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="text-xs font-medium text-tx-secondary uppercase">
            Policy Safety Enforcement
          </div>
          <div className="text-2xl font-bold text-brand mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-status-success" />
            Active
          </div>
          <div className="text-[11px] text-tx-muted mt-0.5">
            Zero Unsupervised Writes
          </div>
        </div>
      </div>

      {/* Pending Approvals Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-tx-primary flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#B45309]" />
            Action Review Queue ({pendingApprovals.length})
          </h2>
          {pendingApprovals.length > 0 && (
            <span className="text-xs text-status-warning font-medium">
              Requires immediate compliance review
            </span>
          )}
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="bg-white border border-surface-border rounded-xl p-10 text-center shadow-card">
            <CheckCircle2 className="w-10 h-10 text-status-success mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-semibold text-tx-primary">
              All Action Reviews Cleared
            </h3>
            <p className="text-xs text-tx-muted mt-1 max-w-md mx-auto">
              No pending write actions require your authorization right now. Future remediation tasks will automatically appear here.
            </p>
          </div>
        ) : (
          pendingApprovals.map((appr) => (
            <div
              key={appr.id}
              className="bg-white border-2 border-amber-300 rounded-xl p-5 sm:p-6 shadow-card space-y-4"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-status-warning-bg text-[#B45309] border border-amber-200">
                      Dual-Key Authorization Gate
                    </span>
                    <span className="text-xs font-mono text-tx-muted">
                      ID: {appr.id}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-tx-primary">
                    {appr.action_summary || "Create External Remediation Ticket"}
                  </h3>

                  <div className="text-xs text-tx-secondary mt-1">
                    Finding Context:{" "}
                    <span className="font-semibold text-tx-primary">
                      {appr.task?.title || "Risk & Governance Finding"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-status-danger-bg text-status-danger border border-[#FECDCA]">
                    Priority: {appr.task?.priority || "HIGH"}
                  </span>
                </div>
              </div>

              {/* Action Details / Task Description */}
              {appr.task?.description && (
                <div className="p-3.5 bg-surface-subtle border border-surface-border rounded-lg text-xs text-tx-primary font-mono leading-relaxed whitespace-pre-wrap">
                  {appr.task.description}
                </div>
              )}

              {/* Impact / Target Service */}
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-brand" />
                  <span className="text-tx-secondary">
                    Target External Integration:{" "}
                    <span className="font-semibold text-tx-primary">Linear Issue Tracker (MCP)</span>
                  </span>
                </div>
                <span className="text-tx-muted font-mono text-[11px]">
                  Created: {new Date(appr.created_at).toLocaleTimeString()}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => openDecisionModal(appr, "approve")}
                  icon={<CheckCircle2 className="w-4 h-4 text-white" />}
                >
                  Authorize & Create Ticket
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => openDecisionModal(appr, "reject")}
                  icon={<XCircle className="w-4 h-4" />}
                >
                  Reject Action
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolved Approvals History Table */}
      <div className="bg-white border border-surface-border rounded-xl shadow-card overflow-hidden">
        <div className="p-5 border-b border-surface-border/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-tx-primary">
              Resolved Policy Gate History
            </h3>
            <p className="text-xs text-tx-secondary mt-0.5">
              Immutable audit log of all human reviews and gate decisions
            </p>
          </div>
          <span className="text-xs text-tx-muted font-medium">
            Total: {resolvedApprovals.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border bg-surface-subtle/50 text-[11px] text-tx-muted uppercase font-semibold">
                <th className="py-3 px-4">Action Summary</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Reviewer</th>
                <th className="py-3 px-4">Decision Justification</th>
                <th className="py-3 px-4 text-right">Resolved Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60">
              {resolvedApprovals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-tx-muted">
                    No resolved approvals in the audit trail yet.
                  </td>
                </tr>
              ) : (
                resolvedApprovals.map((appr) => (
                  <tr key={appr.id} className="hover:bg-surface-subtle transition-colors">
                    <td className="py-3 px-4 font-semibold text-tx-primary max-w-xs truncate">
                      {appr.action_summary}
                    </td>

                    <td className="py-3 px-4">
                      <Badge status={appr.status} />
                    </td>

                    <td className="py-3 px-4 font-mono text-tx-secondary text-[11px]">
                      {appr.reviewer || "compliance_lead@nexus.internal"}
                    </td>

                    <td className="py-3 px-4 text-tx-secondary max-w-sm truncate text-[11px]">
                      {appr.decision_reason || "Approved by policy gate"}
                    </td>

                    <td className="py-3 px-4 font-mono text-tx-muted text-[11px] text-right">
                      {appr.resolved_at ? new Date(appr.resolved_at).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={decisionType === "approve" ? "Authorize Action Execution" : "Reject Proposed Action"}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-tx-secondary">
            {decisionType === "approve"
              ? "Confirming this action will instruct the agent to execute the external write tool (creating a Linear remediation ticket)."
              : "Confirming will reject the action and block execution in the current workflow."}
          </p>

          <div>
            <label className="block text-xs font-semibold text-tx-primary mb-1">
              Reviewer Identity
            </label>
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="w-full text-xs bg-white border border-surface-border rounded-lg p-2 text-tx-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tx-primary mb-1">
              Statutory Justification / Audit Reason
            </label>
            <textarea
              rows={3}
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              className="w-full text-xs bg-white border border-surface-border rounded-lg p-2 text-tx-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={actionLoading !== null}
            >
              Cancel
            </Button>
            <Button
              variant={decisionType === "approve" ? "primary" : "danger"}
              size="sm"
              onClick={handleConfirmDecision}
              loading={actionLoading !== null}
            >
              {decisionType === "approve" ? "Authorize Action" : "Confirm Rejection"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
