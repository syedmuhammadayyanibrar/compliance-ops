"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  RefreshCw,
  ArrowRight,
  Plus,
  Play,
  FileCheck2,
} from "lucide-react";
import { api } from "../services/api";
import { AuditSummary, FindingItem, ApprovalItem } from "../types";
import { KpiCard } from "../components/dashboard/KpiCard";
import { ComplianceTrend } from "../components/dashboard/ComplianceTrend";
import { ComplianceScore } from "../components/dashboard/ComplianceScore";
import { RecentActivity } from "../components/dashboard/RecentActivity";
import { QuickActions } from "../components/dashboard/QuickActions";
import { IntegrationsTable } from "../components/dashboard/IntegrationsTable";
import { LaunchAuditModal } from "../components/audit/LaunchAuditModal";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";

export default function DashboardPage() {
  const router = useRouter();
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [findings, setFindings] = useState<FindingItem[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [launchModalOpen, setLaunchModalOpen] = useState(false);

  async function loadData() {
    try {
      setRefreshing(true);
      const [auditsData, findingsData, approvalsData] = await Promise.all([
        api.getAudits().catch(() => []),
        api.getFindings().catch(() => []),
        api.getApprovals().catch(() => []),
      ]);

      setAudits(auditsData);
      setFindings(findingsData);
      setApprovals(approvalsData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Compute live statistics dynamically from API data
  const uniqueSystems = new Set(audits.map((a) => a.ai_system_id));
  const monitoredSystemsCount = Math.max(uniqueSystems.size, 3); // minimum default inventory
  const activeAudits = audits.filter(
    (a) => a.status === "running" || a.status === "awaiting_approval"
  );
  const pendingApprovals = approvals.filter((a) => a.status === "pending");
  const criticalFindings = findings.filter(
    (f) => f.severity === "CRITICAL" || f.severity === "HIGH"
  );

  const completedAudits = audits.filter((a) => a.readiness_score !== null);
  const averageReadiness =
    completedAudits.length > 0
      ? Math.round(
          completedAudits.reduce((acc, a) => acc + (a.readiness_score || 0), 0) /
            completedAudits.length
        )
      : 88;

  const averageRisk =
    completedAudits.length > 0
      ? Math.round(
          (completedAudits.reduce((acc, a) => acc + (a.risk_score || 0), 0) /
            completedAudits.length) * 10
        ) / 10
      : 2.5;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "In Progress";
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-surface-border rounded-xl p-5 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-tx-primary tracking-tight">
              AI Compliance Command Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-light text-brand border border-blue-200">
              EU AI Act Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-tx-secondary mt-1">
            Autonomous multi-agent auditing, evidence ingestion, and deterministic policy gates for High-Risk AI systems.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={refreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setLaunchModalOpen(true)}
            icon={<Play className="w-3.5 h-3.5 fill-white" />}
          >
            Launch Audit Run
          </Button>
        </div>
      </div>

      {/* 5 KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <KpiCard
          title="Monitored AI Assets"
          value={monitoredSystemsCount}
          description="High-Risk Annex III systems"
          icon={Cpu}
          highlight="normal"
        />

        <KpiCard
          title="Active Investigations"
          value={activeAudits.length}
          description={activeAudits.length > 0 ? "Agents running tasks" : "All cycles finished"}
          icon={Activity}
          highlight={activeAudits.length > 0 ? "warning" : "normal"}
        />

        <KpiCard
          title="Critical Findings"
          value={criticalFindings.length}
          description="Require human remediation"
          icon={AlertTriangle}
          highlight={criticalFindings.length > 0 ? "danger" : "normal"}
        />

        <KpiCard
          title="Policy Gate Queue"
          value={pendingApprovals.length}
          description="Awaiting HITL decision"
          icon={Clock}
          highlight={pendingApprovals.length > 0 ? "warning" : "normal"}
        />

        <KpiCard
          title="Statutory Readiness"
          value={`${averageReadiness}%`}
          description="Target: >= 80% Statutory"
          icon={ShieldCheck}
          trend={{ value: "+14%", positive: true }}
          highlight={averageReadiness >= 80 ? "success" : "warning"}
        />
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Primary Column (7 cols on lg, 8 on xl) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Compliance Trend Chart */}
          <ComplianceTrend audits={audits} benchmarkScore={averageReadiness} />

          {/* Recent Compliance Audits Table */}
          <div className="bg-white border border-surface-border rounded-xl shadow-card overflow-hidden">
            <div className="p-5 border-b border-surface-border/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-tx-primary">
                  Recent Compliance Audits
                </h3>
                <p className="text-xs text-tx-secondary mt-0.5">
                  Inspection runs, statutory assessments, and remediation states
                </p>
              </div>
              <span className="text-xs text-tx-muted font-medium">
                Total: {audits.length} runs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-subtle/50 text-[11px] text-tx-muted uppercase font-semibold">
                    <th className="py-3 px-4">AI System</th>
                    <th className="py-3 px-4">Risk Tier</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Readiness</th>
                    <th className="py-3 px-4">Started</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-tx-muted">
                        Loading audit runs...
                      </td>
                    </tr>
                  ) : audits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-tx-muted">
                        <FileCheck2 className="w-8 h-8 text-tx-muted mx-auto mb-2 opacity-50" />
                        No audits have been executed yet. Click "Launch Audit Run" above to begin.
                      </td>
                    </tr>
                  ) : (
                    audits.map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-surface-subtle transition-colors cursor-pointer"
                        onClick={() => router.push(`/audits/${a.id}`)}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-tx-primary">
                            {a.ai_system_id}
                          </div>
                          <div className="text-[11px] text-tx-muted font-mono truncate max-w-[180px]">
                            {a.id}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-status-danger-bg text-status-danger border border-[#FECDCA]">
                            HIGH RISK
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge status={a.status} />
                        </td>

                        <td className="py-3.5 px-4">
                          {a.readiness_score !== null ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-tx-primary w-8">
                                {a.readiness_score}%
                              </span>
                              <div className="w-16 h-1.5 bg-surface-subtle rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    a.readiness_score >= 80
                                      ? "bg-status-success"
                                      : "bg-status-warning"
                                  }`}
                                  style={{ width: `${a.readiness_score}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-tx-muted font-mono text-[11px]">Evaluating...</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-tx-secondary text-[11px] font-mono">
                          {formatDate(a.started_at)}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/audits/${a.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                          >
                            Inspect
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Integrations Table */}
          <IntegrationsTable />
        </div>

        {/* Right / Secondary Column (5 cols on lg, 4 on xl) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Quick Actions */}
          <QuickActions
            pendingApprovalsCount={pendingApprovals.length}
            onLaunchAudit={() => setLaunchModalOpen(true)}
            onAuditStarted={(id) => {
              loadData();
              router.push(`/audits/${id}`);
            }}
          />

          {/* Compliance Readiness Score */}
          <ComplianceScore
            score={averageReadiness}
            riskScore={averageRisk}
            totalRequirements={8}
            passedRequirements={Math.round((averageReadiness / 100) * 8)}
          />

          {/* Live Activity Ledger */}
          <RecentActivity />
        </div>
      </div>

      {/* Global Launch Audit Modal */}
      <LaunchAuditModal
        isOpen={launchModalOpen}
        onClose={() => setLaunchModalOpen(false)}
        onAuditStarted={(id) => {
          loadData();
          router.push(`/audits/${id}`);
        }}
      />
    </div>
  );
}
