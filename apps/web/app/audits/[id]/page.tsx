"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Circle,
  ArrowLeft,
  ExternalLink,
  FileText,
  Terminal,
  Cpu,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Layers,
  Search,
} from "lucide-react";
import { api } from "../../../services/api";
import { AuditDetail, AuditEvent, ApprovalItem } from "../../../types";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";

export default function AuditRunPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params?.id as string;

  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [pendingApproval, setPendingApproval] = useState<ApprovalItem | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

  const loadAuditData = async () => {
    try {
      const [aData, evData, appData] = await Promise.all([
        api.getAudit(auditId).catch(() => null),
        api.getAuditEvents(auditId).catch(() => []),
        api.getApprovals("pending").catch(() => []),
      ]);

      if (aData) setAudit(aData);
      if (evData) setEvents(evData);
      if (appData) {
        const found = appData.find((a) => a.run_id === auditId);
        setPendingApproval(found || null);
      }
    } catch (err) {
      console.error("Error loading audit detail:", err);
    }
  };

  useEffect(() => {
    loadAuditData();

    // Live Server-Sent Events stream
    const eventSource = new EventSource(`${apiUrl}/api/audits/${auditId}/events/stream`);
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "agent_event") {
          setEvents((prev) => [...prev, data]);
        } else if (data.type === "approval_required" || data.type === "audit_completed") {
          loadAuditData();
        }
      } catch (err) {
        // SSE parsing error
      }
    };

    return () => {
      eventSource.close();
    };
  }, [auditId]);

  async function handleApproval(decision: "approve" | "reject") {
    if (!pendingApproval) return;
    setIsResolving(true);
    try {
      await api.resolveApproval(
        pendingApproval.id,
        decision,
        "compliance_lead@nexus.internal",
        decision === "approve"
          ? "Approved for Linear remediation ticket creation"
          : "Rejected by compliance officer"
      );
      setPendingApproval(null);
      await loadAuditData();
    } catch (err) {
      alert("Error resolving approval. Check backend API.");
    } finally {
      setIsResolving(false);
    }
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(auditId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Structured Statutory Investigation Phases
  const investigationPhases = [
    {
      key: "classify",
      label: "System Classification (Annex III)",
      agent: "ClassifierNode",
      isDone: events.some((e) => e.step === "classify"),
    },
    {
      key: "plan",
      label: "Investigation Scope & Plan",
      agent: "PlannerNode",
      isDone: events.some((e) => e.step === "plan"),
    },
    {
      key: "retrieve_requirements",
      label: "Statutory Requirement Retrieval",
      agent: "RequirementsRetrieval",
      isDone: events.some((e) => e.step === "retrieve_requirements"),
    },
    {
      key: "gather_github",
      label: "GitHub Code & Config Evidence",
      agent: "EvidenceCollector",
      isDone: events.some((e) => e.tool?.includes("github") && e.status === "success"),
    },
    {
      key: "gather_drive",
      label: "Google Drive Governance Evidence",
      agent: "EvidenceCollector",
      isDone: events.some((e) => e.tool?.includes("drive") && e.status === "success"),
    },
    {
      key: "analyze",
      label: "Deterministic Gap Analysis",
      agent: "PolicyEvaluator",
      isDone: events.some((e) => e.step === "analyze"),
    },
    {
      key: "approval",
      label: "Human-in-the-Loop Policy Gate",
      agent: "HumanGate",
      isDone: audit?.status === "completed" || (events.some((e) => e.step === "execute_remediation") && !pendingApproval),
      isActionRequired: audit?.status === "awaiting_approval" || !!pendingApproval,
    },
    {
      key: "remediation",
      label: "Action Remediation & Ticketing",
      agent: "ActionExecutor",
      isDone: events.some((e) => e.step === "execute_remediation"),
    },
    {
      key: "verify",
      label: "Synthesis & Verification",
      agent: "ReportSynthesizer",
      isDone: audit?.status === "completed" || events.some((e) => e.step === "verify"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="bg-white border border-surface-border rounded-xl p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-tx-secondary hover:text-tx-primary font-medium mr-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Audits
            </Link>
            <span className="text-tx-muted">•</span>
            <div className="flex items-center gap-1.5 font-mono text-xs text-tx-secondary">
              <span>Run ID:</span>
              <span className="font-semibold text-tx-primary">{auditId?.slice(0, 8)}...</span>
              <button
                onClick={handleCopyId}
                className="p-1 rounded text-tx-muted hover:text-tx-primary transition"
                title="Copy Run ID"
              >
                {copied ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge status={audit?.status || "running"} />
            <Button
              variant="outline"
              size="sm"
              onClick={loadAuditData}
              icon={<RefreshCw className="w-3 h-3" />}
            >
              Sync
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-surface-border/60">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-tx-primary">
                {audit?.ai_system_id || "AI System Audit"}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-status-danger-bg text-status-danger border border-[#FECDCA]">
                HIGH RISK ANNEX III
              </span>
            </div>
            <p className="text-xs text-tx-secondary mt-1 max-w-3xl">
              {audit?.user_goal || "Evaluating EU AI Act High-Risk regulatory compliance requirements."}
            </p>
          </div>

          {audit?.readiness_score !== null && audit?.readiness_score !== undefined && (
            <div className="flex items-center gap-3 bg-surface-subtle p-3 rounded-lg border border-surface-border">
              <div>
                <div className="text-[10px] uppercase font-semibold text-tx-muted">
                  Readiness Score
                </div>
                <div className="text-xl font-bold text-tx-primary">
                  {audit.readiness_score}%
                </div>
              </div>
              <div className="w-12 h-1.5 bg-surface-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    audit.readiness_score >= 80 ? "bg-status-success" : "bg-status-warning"
                  }`}
                  style={{ width: `${audit.readiness_score}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Human Approval Required Gate Banner */}
      {pendingApproval && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-5 shadow-card space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-[#B45309]">
              <ShieldAlert className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B45309]">
                  Dual-Key Policy Gate Triggered
                </span>
                <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-status-danger-bg text-status-danger border border-[#FECDCA]">
                  CRITICAL ACTION
                </span>
              </div>

              <h3 className="text-sm font-bold text-tx-primary mt-1">
                Consequential Action Paused: {pendingApproval.action_summary}
              </h3>

              {pendingApproval.task && (
                <div className="bg-white border border-amber-200 rounded-lg p-3 mt-2 text-xs font-mono text-tx-secondary space-y-1">
                  <div><span className="font-semibold text-tx-primary">Target:</span> Linear Issue Tracker</div>
                  <div><span className="font-semibold text-tx-primary">Finding:</span> {pendingApproval.task.title}</div>
                  <div><span className="font-semibold text-tx-primary">Priority:</span> {pendingApproval.task.priority}</div>
                </div>
              )}

              <div className="flex items-center gap-2.5 mt-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleApproval("approve")}
                  loading={isResolving}
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Authorize & Create Ticket
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleApproval("reject")}
                  disabled={isResolving}
                >
                  Reject Action
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Investigation Stages Checklist (5 cols) */}
        <div className="lg:col-span-4 bg-white border border-surface-border rounded-xl p-5 shadow-card h-fit space-y-4">
          <div className="border-b border-surface-border/60 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-tx-primary flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand" />
              Statutory Stage Checklist
            </h2>
            <p className="text-[11px] text-tx-muted mt-0.5">
              LangGraph autonomous execution pipeline
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {investigationPhases.map((phase, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2.5 p-2 rounded-lg transition ${
                  phase.isActionRequired
                    ? "bg-amber-50 border border-amber-300"
                    : phase.isDone
                    ? "bg-surface-subtle/50"
                    : "opacity-60"
                }`}
              >
                {phase.isActionRequired ? (
                  <span className="text-[#B45309] font-bold text-sm leading-none mt-0.5">⚠</span>
                ) : phase.isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-tx-muted shrink-0 mt-0.5" />
                )}

                <div className="min-w-0 flex-1">
                  <div
                    className={`font-sans font-medium text-xs truncate ${
                      phase.isActionRequired
                        ? "text-[#B45309] font-semibold"
                        : phase.isDone
                        ? "text-tx-primary"
                        : "text-tx-muted"
                    }`}
                  >
                    {phase.label}
                  </div>
                  <div className="text-[10px] text-tx-muted font-mono truncate mt-0.5">
                    {phase.agent}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Evidence Ledger Shortcut */}
          <div className="pt-3 border-t border-surface-border/60">
            <Link
              href={`/evidence`}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-surface-border hover:bg-surface-subtle text-xs font-medium text-tx-primary transition"
            >
              <span className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-brand" />
                Inspect Ingested Evidence
              </span>
              <ExternalLink className="w-3 h-3 text-tx-muted" />
            </Link>
          </div>
        </div>

        {/* Right Column: Live Event Stream & Tool Telemetry (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-surface-border rounded-xl shadow-card overflow-hidden flex flex-col">
          <div className="p-4 border-b border-surface-border/60 flex items-center justify-between bg-surface-subtle/40">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-brand" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-tx-primary">
                Agent Trace Stream ({events.length} events)
              </h3>
            </div>
            <span className="text-[11px] text-tx-muted font-mono">
              Live WebSocket / SSE Feed
            </span>
          </div>

          <div className="p-4 space-y-3 max-h-[650px] overflow-y-auto">
            {events.length === 0 ? (
              <div className="py-12 text-center text-xs text-tx-muted">
                Awaiting telemetry events from orchestration runtime...
              </div>
            ) : (
              events.map((ev, i) => {
                const isExpanded = expandedEventId === i;
                return (
                  <div
                    key={i}
                    className="border border-surface-border rounded-lg p-3 hover:border-brand/40 transition bg-white text-xs space-y-2 cursor-pointer"
                    onClick={() => setExpandedEventId(isExpanded ? null : i)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-brand font-mono font-semibold text-[10px] border border-blue-100">
                          {ev.agent}
                        </span>
                        <span className="font-semibold text-tx-primary">
                          {ev.step}
                        </span>
                        {ev.tool && (
                          <span className="text-tx-muted font-mono text-[11px]">
                            ({ev.tool})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[10px]">
                        <span className="text-tx-muted">{ev.latency}s</span>
                        {ev.verified ? (
                          <span className="px-1.5 py-0.5 rounded bg-status-success-bg text-status-success border border-[#C6F0DD] font-semibold">
                            VERIFIED
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-surface-subtle text-tx-secondary border border-surface-border">
                            OK
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-tx-muted" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-tx-muted" />
                        )}
                      </div>
                    </div>

                    {/* Brief payload summary */}
                    {!isExpanded && (
                      <div className="text-[11px] text-tx-secondary font-mono truncate">
                        {ev.output
                          ? `OUT: ${JSON.stringify(ev.output).slice(0, 90)}...`
                          : ev.input
                          ? `IN: ${JSON.stringify(ev.input).slice(0, 90)}...`
                          : "Step executed successfully"}
                      </div>
                    )}

                    {/* Detailed JSON inspection when clicked */}
                    {isExpanded && (
                      <div className="space-y-2 pt-2 border-t border-surface-border/60 text-[11px] font-mono">
                        {ev.input && (
                          <div>
                            <div className="text-tx-muted font-semibold mb-0.5">Input Parameters:</div>
                            <pre className="p-2.5 rounded bg-surface-subtle text-tx-primary overflow-x-auto max-h-40 border border-surface-border">
                              {JSON.stringify(ev.input, null, 2)}
                            </pre>
                          </div>
                        )}
                        {ev.output && (
                          <div>
                            <div className="text-tx-muted font-semibold mb-0.5">Output Data:</div>
                            <pre className="p-2.5 rounded bg-surface-subtle text-tx-primary overflow-x-auto max-h-40 border border-surface-border">
                              {JSON.stringify(ev.output, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
