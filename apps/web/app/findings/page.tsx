"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  HelpCircle,
  Search,
  Filter,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Tag,
  CheckSquare,
  ExternalLink,
} from "lucide-react";
import { api } from "../../services/api";
import { FindingItem } from "../../types";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Drawer } from "../../components/ui/Drawer";

function FindingsContent() {
  const searchParams = useSearchParams();
  const [findings, setFindings] = useState<FindingItem[]>([]);
  const [activeStatus, setActiveStatus] = useState<string>("ALL");
  const [activeSeverity, setActiveSeverity] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("search") || searchParams.get("q") || ""
  );
  const [selectedFinding, setSelectedFinding] = useState<FindingItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = searchParams.get("search") || searchParams.get("q");
    if (q) setSearchQuery(q);
  }, [searchParams]);

  async function loadData() {
    try {
      setLoading(true);
      const data = await api.getFindings(activeStatus, activeSeverity);
      setFindings(data);
    } catch (err) {
      console.error("Failed to load findings:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [activeStatus, activeSeverity]);

  const filteredFindings = findings.filter((f) => {
    const matchesSearch =
      !searchQuery ||
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.requirement_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.missing_controls.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const openFindingDetail = (finding: FindingItem) => {
    setSelectedFinding(finding);
    setIsDrawerOpen(true);
  };

  const criticalCount = findings.filter((f) => f.severity === "CRITICAL").length;
  const highCount = findings.filter((f) => f.severity === "HIGH").length;
  const partialCount = findings.filter((f) => f.status === "PARTIAL").length;
  const passCount = findings.filter((f) => f.status === "PASS").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-surface-border rounded-xl p-5 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-tx-primary tracking-tight">
              Compliance Findings & Gap Analysis
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-status-warning border border-amber-200">
              Regulatory Triage
            </span>
          </div>
          <p className="text-xs sm:text-sm text-tx-secondary mt-1">
            Automated statutory evaluations against EU AI Act requirements with missing controls and human-in-the-loop remediation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
          >
            Refresh Findings
          </Button>
        </div>
      </div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="text-xs font-medium text-tx-secondary uppercase">
            Critical / High Gaps
          </div>
          <div className="text-2xl font-bold text-status-danger mt-1">
            {criticalCount + highCount}
          </div>
          <div className="text-[11px] text-tx-muted mt-0.5">
            Require urgent remediation
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="text-xs font-medium text-tx-secondary uppercase">
            Partial Gaps
          </div>
          <div className="text-2xl font-bold text-[#B45309] mt-1">
            {partialCount}
          </div>
          <div className="text-[11px] text-tx-muted mt-0.5">
            Missing secondary controls
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="text-xs font-medium text-tx-secondary uppercase">
            Compliant Controls
          </div>
          <div className="text-2xl font-bold text-status-success mt-1">
            {passCount}
          </div>
          <div className="text-[11px] text-tx-muted mt-0.5">
            Satisfies EU AI Act requirements
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="text-xs font-medium text-tx-secondary uppercase">
            Total Evaluated
          </div>
          <div className="text-2xl font-bold text-tx-primary mt-1">
            {findings.length}
          </div>
          <div className="text-[11px] text-tx-muted mt-0.5">
            Annex III Core Articles
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-tx-muted" />
          <input
            type="text"
            placeholder="Search requirements, controls, text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs bg-surface-subtle border border-surface-border rounded-lg text-tx-primary placeholder:text-tx-muted focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/20 focus:border-brand transition"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Status Tabs */}
          <div className="flex bg-surface-subtle p-1 rounded-lg border border-surface-border">
            {["ALL", "FAIL", "PARTIAL", "PASS"].map((st) => (
              <button
                key={st}
                onClick={() => setActiveStatus(st)}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  activeStatus === st
                    ? "bg-white text-tx-primary font-semibold shadow-xs"
                    : "text-tx-secondary hover:text-tx-primary"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Severity Dropdown */}
          <select
            value={activeSeverity}
            onChange={(e) => setActiveSeverity(e.target.value)}
            className="h-8 text-xs bg-surface-subtle border border-surface-border rounded-lg px-2 text-tx-secondary focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/20"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Findings Table */}
      <div className="bg-white border border-surface-border rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border bg-surface-subtle/50 text-[11px] text-tx-muted uppercase font-semibold">
                <th className="py-3 px-4">Requirement</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Finding & Rationale</th>
                <th className="py-3 px-4">Missing Controls</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-tx-muted">
                    Loading findings...
                  </td>
                </tr>
              ) : filteredFindings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-tx-muted">
                    No compliance findings match the current filter.
                  </td>
                </tr>
              ) : (
                filteredFindings.map((finding) => (
                  <tr
                    key={finding.id}
                    className="hover:bg-surface-subtle transition-colors cursor-pointer"
                    onClick={() => openFindingDetail(finding)}
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-semibold text-brand">
                        {finding.requirement_id}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge status={finding.status} />
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge severity={finding.severity} />
                    </td>

                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-semibold text-tx-primary truncate">
                        {finding.title}
                      </div>
                      <div className="text-[11px] text-tx-secondary line-clamp-1 mt-0.5">
                        {finding.reason}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {finding.missing_controls.length === 0 ? (
                          <span className="text-[11px] text-tx-muted italic">None</span>
                        ) : (
                          finding.missing_controls.slice(0, 2).map((ctrl, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-status-danger-bg text-status-danger border border-[#FECDCA] truncate max-w-[150px]"
                            >
                              ✕ {ctrl}
                            </span>
                          ))
                        )}
                        {finding.missing_controls.length > 2 && (
                          <span className="text-[10px] text-tx-muted self-center">
                            +{finding.missing_controls.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-tx-primary font-semibold">
                        {Math.round(finding.confidence * 100)}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openFindingDetail(finding);
                        }}
                        className="text-xs font-semibold text-brand hover:underline"
                      >
                        Triage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-Over Drawer for Finding Detail & Remediation */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Statutory Finding & Remediation Analysis"
        size="lg"
      >
        {selectedFinding && (
          <div className="space-y-5">
            {/* Header info card */}
            <div className="bg-surface-subtle border border-surface-border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-brand bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {selectedFinding.requirement_id}
                </span>
                <div className="flex items-center gap-2">
                  <Badge status={selectedFinding.status} />
                  <Badge severity={selectedFinding.severity} />
                </div>
              </div>

              <h3 className="font-bold text-base text-tx-primary">
                {selectedFinding.title}
              </h3>

              <div className="text-xs text-tx-muted font-mono">
                Evaluator Confidence: {(selectedFinding.confidence * 100).toFixed(0)}% • Deterministic Rule Pass
              </div>
            </div>

            {/* Assessment Reason / Root Cause */}
            <div>
              <h4 className="text-xs font-semibold text-tx-primary uppercase tracking-wider mb-1.5">
                Evaluation Rationale & Evidence Gap
              </h4>
              <div className="p-3.5 bg-white border border-surface-border rounded-lg text-xs text-tx-primary leading-relaxed">
                {selectedFinding.reason}
              </div>
            </div>

            {/* Missing Controls List */}
            {selectedFinding.missing_controls.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-status-danger uppercase tracking-wider mb-1.5">
                  Missing Mandatory Controls ({selectedFinding.missing_controls.length})
                </h4>
                <div className="space-y-1.5">
                  {selectedFinding.missing_controls.map((ctrl, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-lg bg-status-danger-bg/40 border border-[#FECDCA] text-xs text-status-danger font-mono"
                    >
                      <span className="font-bold">✕</span>
                      <span>{ctrl}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remediation Strategy */}
            {selectedFinding.remediation && (
              <div className="p-4 bg-brand/5 border border-brand/20 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-brand">
                  <ShieldAlert className="w-4 h-4" />
                  Statutory Remediation Directive
                </div>
                <p className="text-xs text-tx-secondary leading-relaxed">
                  {selectedFinding.remediation}
                </p>
              </div>
            )}

            {/* Remediation Tasks / Linked Tickets */}
            {selectedFinding.remediation_tasks && selectedFinding.remediation_tasks.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-tx-primary uppercase tracking-wider mb-2">
                  Generated Remediation Tasks ({selectedFinding.remediation_tasks.length})
                </h4>
                <div className="space-y-2">
                  {selectedFinding.remediation_tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-white border border-surface-border rounded-lg shadow-xs flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-tx-primary">
                          {task.title}
                        </div>
                        <div className="text-[11px] text-tx-muted mt-0.5">
                          External System: <span className="font-mono">{task.external_system}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-subtle text-tx-secondary border border-surface-border">
                          {task.status}
                        </span>
                        <Link
                          href="/approvals"
                          className="px-2.5 py-1 rounded bg-brand text-white text-[11px] font-semibold hover:bg-brand-hover transition"
                        >
                          Review Gate
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default function FindingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-tx-muted">Loading findings...</div>}>
      <FindingsContent />
    </Suspense>
  );
}
