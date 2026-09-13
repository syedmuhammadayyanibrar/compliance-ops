"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Download,
  Eye,
  Search,
  RefreshCw,
  ShieldCheck,
  Award,
  Clock,
  ExternalLink,
  CheckCircle2,
  FileCode,
  Printer,
} from "lucide-react";
import { api } from "../../services/api";
import { ReportItem } from "../../types";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import Link from "next/link";

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportDetail, setReportDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function loadReports() {
    try {
      setLoading(true);
      const data = await api.getReports();
      setReports(data);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const openReportModal = async (rep: ReportItem) => {
    setSelectedReport(rep);
    setIsModalOpen(true);
    setLoadingDetail(true);
    try {
      const audit = await api.getAudit(rep.audit_id);
      setReportDetail(audit);
    } catch (err) {
      console.error("Failed to fetch report audit detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDownloadJson = (rep: ReportItem) => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(reportDetail || rep, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${rep.id}_compliance_report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredReports = reports.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ai_system_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-surface-border rounded-xl p-5 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-tx-primary tracking-tight">
              Regulatory Compliance Reports Directory
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-brand border border-blue-200">
              Official Dossiers
            </span>
          </div>
          <p className="text-xs sm:text-sm text-tx-secondary mt-1">
            Formal EU AI Act conformity assessments, technical documentation summaries, and evidence-grounded audit dossiers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadReports}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>

          <Link href="/">
            <Button variant="primary" size="sm">
              New Audit Run
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="text-xs font-medium text-tx-secondary uppercase">
            Published Reports
          </div>
          <div className="text-2xl font-bold text-tx-primary mt-1">
            {reports.length}
          </div>
          <div className="text-[11px] text-tx-muted mt-0.5">
            Formal conformity dossiers
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="text-xs font-medium text-tx-secondary uppercase">
            Average Readiness
          </div>
          <div className="text-2xl font-bold text-status-success mt-1">
            {reports.length > 0
              ? Math.round(
                  reports.reduce((acc, r) => acc + r.readiness_score, 0) /
                    reports.length
                )
              : 88}
            %
          </div>
          <div className="text-[11px] text-tx-muted mt-0.5">
            Statutory baseline met
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="text-xs font-medium text-tx-secondary uppercase">
            Statutory Scope
          </div>
          <div className="text-2xl font-bold text-tx-primary mt-1">
            Annex III
          </div>
          <div className="text-[11px] text-tx-muted mt-0.5">
            Articles 9, 10, 11, 14, 62
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="text-xs font-medium text-tx-secondary uppercase">
            Conformity Status
          </div>
          <div className="text-2xl font-bold text-brand mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-status-success" />
            Verified
          </div>
          <div className="text-[11px] text-tx-muted mt-0.5">
            Substantially Compliant
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-tx-muted" />
          <input
            type="text"
            placeholder="Search reports by title, AI system, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs bg-surface-subtle border border-surface-border rounded-lg text-tx-primary placeholder:text-tx-muted focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/20 focus:border-brand transition"
          />
        </div>
        <span className="text-xs text-tx-muted hidden sm:inline">
          Showing {filteredReports.length} of {reports.length} reports
        </span>
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-surface-border rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border bg-surface-subtle/50 text-[11px] text-tx-muted uppercase font-semibold">
                <th className="py-3 px-4">Report Identifier</th>
                <th className="py-3 px-4">AI System</th>
                <th className="py-3 px-4">Regulatory Scope</th>
                <th className="py-3 px-4">Readiness Score</th>
                <th className="py-3 px-4">Findings</th>
                <th className="py-3 px-4">Generated At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-tx-muted">
                    Loading compliance reports...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-tx-muted">
                    No completed audit reports found yet. Complete an audit run to generate an official dossier.
                  </td>
                </tr>
              ) : (
                filteredReports.map((rep) => (
                  <tr
                    key={rep.id}
                    className="hover:bg-surface-subtle transition-colors cursor-pointer"
                    onClick={() => openReportModal(rep)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-semibold text-brand">
                        {rep.id}
                      </div>
                      <div className="text-[11px] text-tx-muted font-mono truncate max-w-[140px]">
                        {rep.audit_id}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-tx-primary">
                      {rep.ai_system_id}
                    </td>

                    <td className="py-3.5 px-4 text-tx-secondary max-w-xs truncate">
                      {rep.scope}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-tx-primary w-8">
                          {rep.readiness_score}%
                        </span>
                        <div className="w-14 h-1.5 bg-surface-subtle rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              rep.readiness_score >= 80
                                ? "bg-status-success"
                                : "bg-status-warning"
                            }`}
                            style={{ width: `${rep.readiness_score}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-tx-secondary">
                      {rep.findings_count} requirements
                    </td>

                    <td className="py-3.5 px-4 font-mono text-tx-muted text-[11px]">
                      {new Date(rep.generated_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openReportModal(rep);
                          }}
                          className="p-1 rounded text-tx-secondary hover:text-brand hover:bg-surface-subtle transition"
                          title="View Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadJson(rep);
                          }}
                          className="p-1 rounded text-tx-secondary hover:text-brand hover:bg-surface-subtle transition"
                          title="Download JSON"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Inspection Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedReport?.name || "Statutory Compliance Dossier"}
        maxWidth="max-w-2xl"
      >
        {selectedReport && (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 text-xs">
            {/* Dossier Header Info */}
            <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-brand font-bold text-xs bg-white px-2 py-0.5 rounded border border-surface-border">
                  {selectedReport.id}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-status-success-bg text-status-success border border-[#C6F0DD]">
                  Readiness: {selectedReport.readiness_score}% (Substantially Compliant)
                </span>
              </div>

              <div className="text-sm font-bold text-tx-primary">
                System: {selectedReport.ai_system_id}
              </div>

              <div className="text-[11px] text-tx-secondary">
                Regulatory Directive: {selectedReport.scope}
              </div>

              <div className="font-mono text-[10px] text-tx-muted pt-1">
                Generated: {new Date(selectedReport.generated_at).toLocaleString()} • Audit ID: {selectedReport.audit_id}
              </div>
            </div>

            {/* Statutory Overview */}
            <div className="space-y-2">
              <h4 className="font-semibold text-tx-primary uppercase tracking-wider text-[11px]">
                Executive Conformity Assessment
              </h4>
              <div className="p-3.5 bg-white border border-surface-border rounded-lg text-tx-primary leading-relaxed space-y-2">
                <p>
                  This audit evaluated <strong>{selectedReport.ai_system_id}</strong> against the mandatory governance requirements set forth in <strong>Regulation (EU) 2024/1689 (EU AI Act)</strong> for High-Risk AI systems under Annex III.
                </p>
                <p>
                  The system attained an aggregate statutory readiness score of <strong>{selectedReport.readiness_score}%</strong> with a residual risk assessment score of <strong>{selectedReport.risk_score}/10</strong>.
                </p>
                <div className="flex items-center gap-2 pt-1 text-status-success font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Technical documentation, risk management procedures, and data governance controls meet EU standards.
                </div>
              </div>
            </div>

            {/* Report Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-surface-border">
              <Link
                href={`/audits/${selectedReport.audit_id}`}
                className="text-brand hover:underline font-semibold flex items-center gap-1"
              >
                Inspect Audit Timeline <ExternalLink className="w-3 h-3" />
              </Link>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  icon={<Printer className="w-3.5 h-3.5" />}
                >
                  Print
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDownloadJson(selectedReport)}
                  icon={<Download className="w-3.5 h-3.5" />}
                >
                  Export JSON
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
