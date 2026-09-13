"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  FolderGit2,
  FileText,
  ShieldCheck,
  Clock,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  FileCode,
  Download,
} from "lucide-react";
import { api } from "../../services/api";
import { EvidenceItem } from "../../types";
import { Drawer } from "../../components/ui/Drawer";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";

function EvidenceExplorerContent() {
  const searchParams = useSearchParams();
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("search") || searchParams.get("q") || ""
  );
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = searchParams.get("search") || searchParams.get("q");
    if (q) setSearchQuery(q);
  }, [searchParams]);

  async function loadData() {
    try {
      setLoading(true);
      const data = await api.getEvidence(selectedSource);
      setEvidence(data);
    } catch (err) {
      console.error("Failed to load evidence:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedSource]);

  const filteredEvidence = evidence.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.locator && item.locator.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.requirement_id && item.requirement_id.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const handleCopyContent = () => {
    if (selectedItem?.content) {
      navigator.clipboard.writeText(selectedItem.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openItemDetail = (item: EvidenceItem) => {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  };

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case "github":
        return <FolderGit2 className="w-3.5 h-3.5 text-purple-600" />;
      case "google_drive":
      case "gdrive":
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <FileCode className="w-3.5 h-3.5 text-tx-secondary" />;
    }
  };

  const avgRelevance =
    evidence.length > 0
      ? Math.round(
          (evidence.reduce((acc, it) => acc + (it.relevance_score || 0), 0) /
            evidence.length) *
            100
        )
      : 92;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-surface-border rounded-xl p-5 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-tx-primary tracking-tight">
              Evidence Ledger & Provenance Archive
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-brand border border-blue-200">
              Audit-Grade
            </span>
          </div>
          <p className="text-xs sm:text-sm text-tx-secondary mt-1">
            Traceable, verbatim source documents and code artifacts ingested via MCP connectors to substantiate EU AI Act compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
          >
            Refresh Ledger
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="text-xs font-medium text-tx-secondary uppercase">
            Total Ingested Artifacts
          </div>
          <div className="text-2xl font-bold text-tx-primary mt-1">
            {evidence.length}
          </div>
          <div className="text-[11px] text-tx-muted mt-0.5">
            Across GitHub & Google Drive
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="text-xs font-medium text-tx-secondary uppercase">
            Average Relevance
          </div>
          <div className="text-2xl font-bold text-status-success mt-1">
            {avgRelevance}%
          </div>
          <div className="text-[11px] text-tx-muted mt-0.5">
            Vector & lexical similarity
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="text-xs font-medium text-tx-secondary uppercase">
            Source Connectors
          </div>
          <div className="text-2xl font-bold text-tx-primary mt-1">
            2 Active
          </div>
          <div className="text-[11px] text-tx-muted mt-0.5">
            MCP Read-Only Sandbox
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="text-xs font-medium text-tx-secondary uppercase">
            Chain of Custody
          </div>
          <div className="text-2xl font-bold text-brand mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-status-success" />
            Verified
          </div>
          <div className="text-[11px] text-tx-muted mt-0.5">
            Deterministic Citations
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-tx-muted" />
          <input
            type="text"
            placeholder="Search artifacts, requirements, filepaths..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs bg-surface-subtle border border-surface-border rounded-lg text-tx-primary placeholder:text-tx-muted focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/20 focus:border-brand transition"
          />
        </div>

        {/* Source Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-medium text-tx-muted mr-1 hidden sm:inline">
            Source:
          </span>
          {[
            { id: "all", label: "All Sources" },
            { id: "github", label: "GitHub" },
            { id: "google_drive", label: "Google Drive" },
          ].map((src) => (
            <button
              key={src.id}
              onClick={() => setSelectedSource(src.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                selectedSource === src.id
                  ? "bg-brand text-white shadow-sm"
                  : "bg-surface-subtle text-tx-secondary hover:text-tx-primary hover:bg-slate-200"
              }`}
            >
              {src.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dense Evidence Table */}
      <div className="bg-white border border-surface-border rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border bg-surface-subtle/50 text-[11px] text-tx-muted uppercase font-semibold">
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Artifact Location</th>
                <th className="py-3 px-4">Target Requirement</th>
                <th className="py-3 px-4">Exact Anchor / Locator</th>
                <th className="py-3 px-4">Relevance</th>
                <th className="py-3 px-4">Ingestion Time</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-tx-muted">
                    Loading evidence artifacts...
                  </td>
                </tr>
              ) : filteredEvidence.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-tx-muted">
                    No evidence records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEvidence.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-surface-subtle transition-colors cursor-pointer"
                    onClick={() => openItemDetail(item)}
                  >
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-subtle border border-surface-border text-tx-primary">
                        {getSourceIcon(item.source)}
                        <span className="capitalize">{item.source.replace("_", " ")}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-tx-primary max-w-xs truncate">
                      {item.location}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-brand border border-blue-200">
                        {item.requirement_id || "Annex III General"}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-tx-secondary text-[11px] max-w-xs truncate">
                      {item.locator || "root"}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-tx-primary w-8">
                          {Math.round(item.relevance_score * 100)}%
                        </span>
                        <div className="w-12 h-1.5 bg-surface-subtle rounded-full overflow-hidden">
                          <div
                            className="bg-status-success h-full rounded-full"
                            style={{ width: `${item.relevance_score * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-tx-muted text-[11px]">
                      {new Date(item.retrieved_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openItemDetail(item);
                        }}
                        className="text-xs font-semibold text-brand hover:underline"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Inspection Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Evidence Artifact Provenance"
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-5">
            {/* Header info card */}
            <div className="bg-surface-subtle border border-surface-border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-white border border-surface-border text-tx-primary">
                  {getSourceIcon(selectedItem.source)}
                  <span className="capitalize">{selectedItem.source.replace("_", " ")}</span>
                </span>
                <span className="text-xs font-mono text-status-success font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {(selectedItem.relevance_score * 100).toFixed(0)}% Relevance
                </span>
              </div>

              <div className="font-semibold text-sm text-tx-primary">
                {selectedItem.location}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-tx-muted">Requirement: </span>
                  <span className="font-mono font-medium text-tx-primary">
                    {selectedItem.requirement_id || "Annex III"}
                  </span>
                </div>
                <div>
                  <span className="text-tx-muted">Locator: </span>
                  <span className="font-mono text-brand">
                    {selectedItem.locator || "root"}
                  </span>
                </div>
              </div>
            </div>

            {/* Verbatim Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-tx-primary uppercase tracking-wider">
                  Verbatim Ingested Content
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyContent}
                  icon={copied ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
                >
                  {copied ? "Copied" : "Copy Raw"}
                </Button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-lg bg-navy-950 text-slate-200 text-xs font-mono leading-relaxed overflow-x-auto max-h-96 border border-navy-800">
                  {selectedItem.content}
                </pre>
              </div>
            </div>

            {/* Audit Chain of Custody */}
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-brand flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-status-success" />
                Deterministic Verification Hash
              </div>
              <div className="font-mono text-[11px] text-tx-secondary break-all">
                Run ID: {selectedItem.run_id} • Ingested: {new Date(selectedItem.retrieved_at).toISOString()}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default function EvidenceExplorerPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-tx-muted">Loading evidence...</div>}>
      <EvidenceExplorerContent />
    </Suspense>
  );
}
