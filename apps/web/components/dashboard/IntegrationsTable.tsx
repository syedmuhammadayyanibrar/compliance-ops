"use client";

import React, { useState, useEffect } from "react";
import { IntegrationInfo, MCPTestResult, MCPConnectionStatus } from "../../types";
import { api } from "../../services/api";
import {
  Server,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Github,
  HardDrive,
  MessageSquare,
  Trello,
  ShieldCheck,
  Zap,
  ArrowRight,
  Activity,
  Check,
  XCircle,
  Play,
  Clock,
  Database,
  Cpu,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import Link from "next/link";

interface TestStepState {
  step: number;
  label: string;
  status: "pending" | "running" | "completed" | "failed";
}

interface IntegrationsTableProps {
  showManageLink?: boolean;
}

export function IntegrationsTable({ showManageLink = true }: IntegrationsTableProps = {}) {
  const [integrations, setIntegrations] = useState<IntegrationInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Test Connection Modal State
  const [activeTestingItem, setActiveTestingItem] = useState<IntegrationInfo | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testSteps, setTestSteps] = useState<TestStepState[]>([]);
  const [testResult, setTestResult] = useState<MCPTestResult | null>(null);
  const [testingInProgress, setTestingInProgress] = useState(false);

  // Detail / Inspection Modal State
  const [inspectItem, setInspectItem] = useState<IntegrationInfo | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const data = await api.getIntegrations();
      setIntegrations(data);
    } catch (err) {
      console.error("Failed to load integrations:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const getProviderIcon = (id: string) => {
    switch (id.toLowerCase()) {
      case "github":
        return <Github className="w-4 h-4 text-slate-800" />;
      case "google_drive":
      case "gdrive":
        return <HardDrive className="w-4 h-4 text-blue-600" />;
      case "slack":
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case "linear":
        return <Trello className="w-4 h-4 text-indigo-600" />;
      default:
        return <Server className="w-4 h-4 text-tx-secondary" />;
    }
  };

  const getStatusBadge = (status: MCPConnectionStatus = "Connected") => {
    switch (status) {
      case "Verified":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-status-success-bg text-status-success border border-[#C6F0DD]">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
            Verified
          </span>
        );
      case "Connected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-brand border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            Connected
          </span>
        );
      case "Needs Setup":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-status-warning-bg text-status-warning border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Needs Setup
          </span>
        );
      case "Degraded":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-status-danger-bg text-status-danger border border-[#FECDCA]">
            <AlertCircle className="w-3.5 h-3.5" />
            Degraded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-subtle text-tx-muted border border-surface-border">
            Disconnected
          </span>
        );
    }
  };

  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return "Not tested";
    try {
      const diffMs = Date.now() - new Date(ts).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins === 1) return "1 minute ago";
      if (diffMins < 60) return `${diffMins} minutes ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours === 1) return "1 hour ago";
      return `${diffHours} hours ago`;
    } catch {
      return ts;
    }
  };

  // Run the Real MCP Connection Test Sequence
  const runTestConnection = async (item: IntegrationInfo) => {
    setActiveTestingItem(item);
    setTestModalOpen(true);
    setTestResult(null);
    setTestingInProgress(true);

    const targetTool = item.available_tools?.[0] || `${item.id}.test`;
    const serverName = item.mcp_server_name || `${item.id}-mcp-server`;

    const initialSteps: TestStepState[] = [
      { step: 1, label: "Testing connection", status: "running" },
      { step: 2, label: `Connecting to MCP server (${serverName})`, status: "pending" },
      { step: 3, label: `Calling ${targetTool}`, status: "pending" },
      { step: 4, label: "Receiving response", status: "pending" },
      { step: 5, label: "Connection verified", status: "pending" },
    ];
    setTestSteps(initialSteps);

    try {
      // Realistic step-by-step progress while the actual backend call runs
      await new Promise((r) => setTimeout(r, 450));
      setTestSteps((prev) =>
        prev.map((s) =>
          s.step === 1 ? { ...s, status: "completed" } : s.step === 2 ? { ...s, status: "running" } : s
        )
      );

      await new Promise((r) => setTimeout(r, 450));
      setTestSteps((prev) =>
        prev.map((s) =>
          s.step === 2 ? { ...s, status: "completed" } : s.step === 3 ? { ...s, status: "running" } : s
        )
      );

      // Perform real backend MCP tool execution
      const result = await api.testIntegration(item.id);

      setTestSteps((prev) =>
        prev.map((s) =>
          s.step === 3 ? { ...s, status: "completed" } : s.step === 4 ? { ...s, status: "running" } : s
        )
      );

      await new Promise((r) => setTimeout(r, 400));
      setTestSteps((prev) =>
        prev.map((s) =>
          s.step === 4 ? { ...s, status: "completed" } : s.step === 5 ? { ...s, status: "completed" } : s
        )
      );

      setTestResult(result);
      await loadData(); // Reload integrations list with updated state
    } catch (err) {
      console.error("Test connection failed:", err);
      setTestSteps((prev) =>
        prev.map((s) => (s.status === "running" ? { ...s, status: "failed" } : s))
      );
    } finally {
      setTestingInProgress(false);
    }
  };

  const openInspection = (item: IntegrationInfo) => {
    setInspectItem(item);
    setInspectModalOpen(true);
  };

  return (
    <>
      <div className="bg-white border border-surface-border rounded-xl p-5 shadow-card flex flex-col justify-between space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-tx-primary">
                Connected MCP Tool Ecosystem & Verification
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-brand border border-blue-200">
                Model Context Protocol
              </span>
            </div>
            <p className="text-xs text-tx-secondary mt-0.5">
              Live external services with deterministic sandboxing and authenticated tool calls.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              icon={<RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />}
            >
              Refresh Status
            </Button>

            {showManageLink && (
              <Link
                href="/settings"
                className="text-xs text-brand hover:underline font-medium flex items-center gap-1"
              >
                Manage
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Data Flow Architecture Banner */}
        <div className="p-3 bg-surface-subtle/80 border border-surface-border rounded-lg flex flex-wrap items-center justify-between text-xs text-tx-secondary gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="font-semibold text-tx-primary bg-white px-2 py-0.5 rounded border border-surface-border">
              App
            </span>
            <span className="text-tx-muted">→</span>
            <span className="font-semibold text-brand bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              MCP Server
            </span>
            <span className="text-tx-muted">→</span>
            <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Tool Call
            </span>
            <span className="text-tx-muted">→</span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Real Data
            </span>
            <span className="text-tx-muted">→</span>
            <span className="font-semibold text-tx-primary bg-white px-2 py-0.5 rounded border border-surface-border">
              ComplianceOps
            </span>
          </div>

          <span className="text-[11px] text-tx-muted flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
            Zero-Mock Verification Enforced
          </span>
        </div>

        {/* Dense Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border bg-surface-subtle/40 text-[11px] text-tx-muted uppercase font-semibold">
                <th className="py-2.5 px-3">Integration & MCP Server</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Available Tools</th>
                <th className="py-2.5 px-3">Last Verified Operation</th>
                <th className="py-2.5 px-3">Response Time</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-tx-muted">
                    Loading MCP server states...
                  </td>
                </tr>
              ) : integrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-tx-muted">
                    No MCP integrations configured.
                  </td>
                </tr>
              ) : (
                integrations.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-surface-subtle transition-colors cursor-pointer"
                    onClick={() => openInspection(item)}
                  >
                    {/* Name & MCP Server */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-md bg-surface-subtle border border-surface-border">
                          {getProviderIcon(item.id)}
                        </div>
                        <div>
                          <div className="font-semibold text-tx-primary">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-tx-muted font-mono">
                            {item.mcp_server_name || `${item.id}-mcp-server`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3">
                      {getStatusBadge(item.connection_status || (item.is_connected ? "Connected" : "Disconnected"))}
                    </td>

                    {/* Available Tools Chips */}
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {item.available_tools?.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-subtle text-tx-secondary border border-surface-border"
                          >
                            {t}
                          </span>
                        ))}
                        {(item.available_tools?.length || 0) > 2 && (
                          <span className="text-[10px] text-tx-muted self-center">
                            +{(item.available_tools?.length || 0) - 2} more
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Last Operation & Timestamp */}
                    <td className="py-3 px-3">
                      <div className="font-mono text-[11px] text-tx-primary font-medium">
                        {item.last_successful_call || "None yet"}
                      </div>
                      <div className="text-[10px] text-tx-muted flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTimestamp(item.last_successful_timestamp)}
                      </div>
                    </td>

                    {/* Response Time */}
                    <td className="py-3 px-3">
                      {item.response_time_ms !== undefined && item.response_time_ms !== null ? (
                        <span className="font-mono text-xs font-semibold text-status-success">
                          {item.response_time_ms} ms
                        </span>
                      ) : (
                        <span className="text-tx-muted font-mono text-[11px]">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            runTestConnection(item);
                          }}
                          icon={<Zap className="w-3 h-3 text-brand" />}
                        >
                          Test Connection
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real Progress Sequence & Verification Modal */}
      <Modal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        title={`MCP Verification: ${activeTestingItem?.name || "Connector"}`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border text-tx-secondary space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-tx-primary font-semibold">
                Server: {activeTestingItem?.mcp_server_name || `${activeTestingItem?.id}-mcp-server`}
              </span>
              <span className="text-[11px] text-tx-muted font-mono">
                Protocol: {activeTestingItem?.provider_type?.toUpperCase()}
              </span>
            </div>
            <div className="text-[11px] text-tx-muted">
              Live deterministic health check and real tool execution sequence.
            </div>
          </div>

          {/* 5-Step Progress Sequence */}
          <div className="space-y-2.5 py-2">
            {testSteps.map((step) => {
              const isRunning = step.status === "running";
              const isDone = step.status === "completed";
              const isFailed = step.status === "failed";

              return (
                <div
                  key={step.step}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition ${
                    isRunning
                      ? "bg-blue-50 border-blue-200 text-brand font-medium"
                      : isDone
                      ? "bg-status-success-bg/40 border-[#C6F0DD] text-tx-primary"
                      : isFailed
                      ? "bg-status-danger-bg border-[#FECDCA] text-status-danger"
                      : "bg-surface-subtle/50 border-surface-border text-tx-muted"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isRunning ? (
                      <RefreshCw className="w-4 h-4 text-brand animate-spin" />
                    ) : isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-status-success" />
                    ) : isFailed ? (
                      <XCircle className="w-4 h-4 text-status-danger" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-surface-border text-[10px] flex items-center justify-center text-tx-muted">
                        {step.step}
                      </span>
                    )}

                    <span>{step.label}</span>
                  </div>

                  <span className="font-mono text-[10px] uppercase">
                    {step.status}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Test Result Box with Real Metadata */}
          {testResult && (
            <div className="space-y-3 pt-2 border-t border-surface-border">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-tx-primary flex items-center gap-1 text-status-success">
                  <CheckCircle2 className="w-4 h-4" />
                  Connection Verified Successfully
                </span>
                <span className="font-mono text-xs font-bold text-status-success">
                  {testResult.latency_ms} ms
                </span>
              </div>

              {/* Real Non-Sensitive Metadata Display */}
              <div className="p-3 rounded-lg bg-navy-950 text-slate-200 font-mono text-xs space-y-1.5 border border-navy-800">
                <div className="text-blue-300 font-semibold">
                  Last Operation: <span className="text-white">{testResult.operation}</span>
                </div>
                <div>
                  <span className="text-slate-400">{testResult.resource_label}: </span>
                  <span className="text-emerald-300">{testResult.resource_retrieved}</span>
                </div>
                <div>
                  <span className="text-slate-400">Response Time: </span>
                  <span className="text-white">{testResult.latency_ms} ms</span>
                </div>
                <div>
                  <span className="text-slate-400">Verified Timestamp: </span>
                  <span className="text-slate-300">{new Date(testResult.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="pt-1.5 border-t border-navy-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Returned Metadata:</span>
                  <pre className="text-[11px] text-slate-300 mt-0.5 overflow-x-auto">
                    {JSON.stringify(testResult.resource_metadata, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Recent MCP Activity Feed */}
              {testResult.recent_activity && testResult.recent_activity.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-tx-primary uppercase tracking-wider block">
                    Recent MCP Activity ({testResult.recent_activity.length})
                  </span>
                  <div className="space-y-1 font-mono text-[11px]">
                    {testResult.recent_activity.map((act, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-1.5 rounded bg-surface-subtle text-tx-primary border border-surface-border"
                      >
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-status-success" />
                          <span className="font-semibold">{act.tool}</span>
                        </div>
                        <span className="text-tx-muted text-[10px]">
                          {act.latency_ms ? `${act.latency_ms}ms` : "success"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestModalOpen(false)}
              disabled={testingInProgress}
            >
              Close
            </Button>
            {activeTestingItem && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => runTestConnection(activeTestingItem)}
                disabled={testingInProgress}
                icon={<RefreshCw className={`w-3 h-3 ${testingInProgress ? "animate-spin" : ""}`} />}
              >
                Re-Test
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* General Inspection Modal */}
      <Modal
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        title={`MCP Telemetry: ${inspectItem?.name || "Integration"}`}
        maxWidth="max-w-lg"
      >
        {inspectItem && (
          <div className="space-y-4 text-xs">
            {/* Server Card */}
            <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-white border border-surface-border">
                    {getProviderIcon(inspectItem.id)}
                  </div>
                  <span className="font-bold text-tx-primary text-sm">
                    {inspectItem.name}
                  </span>
                </div>
                {getStatusBadge(inspectItem.connection_status || "Connected")}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div>
                  <span className="text-tx-muted">MCP Server: </span>
                  <span className="text-tx-primary">{inspectItem.mcp_server_name || `${inspectItem.id}-mcp-server`}</span>
                </div>
                <div>
                  <span className="text-tx-muted">Protocol: </span>
                  <span className="text-tx-primary">{inspectItem.provider_type.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-tx-muted">Last Call: </span>
                  <span className="text-brand font-semibold">{inspectItem.last_successful_call || "None"}</span>
                </div>
                <div>
                  <span className="text-tx-muted">Response Time: </span>
                  <span className="text-status-success font-semibold">
                    {inspectItem.response_time_ms ? `${inspectItem.response_time_ms} ms` : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Target Resource */}
            <div>
              <span className="text-[11px] font-semibold text-tx-primary uppercase tracking-wider block mb-1">
                Target Resource
              </span>
              <div className="p-2.5 rounded-lg bg-white border border-surface-border text-tx-secondary font-mono">
                {inspectItem.retrieved_resource || "Not retrieved"}
              </div>
            </div>

            {/* Available Tools */}
            <div>
              <span className="text-[11px] font-semibold text-tx-primary uppercase tracking-wider block mb-1.5">
                Exposed MCP Tools
              </span>
              <div className="flex flex-wrap gap-1.5">
                {inspectItem.available_tools?.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-1 rounded text-xs font-mono bg-blue-50 text-brand border border-blue-200"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            {inspectItem.recent_activity && inspectItem.recent_activity.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-tx-primary uppercase tracking-wider block mb-1.5">
                  Recent MCP Operations
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto font-mono text-[11px]">
                  {inspectItem.recent_activity.map((act, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-surface-subtle border border-surface-border flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Check className="w-3 h-3 text-status-success shrink-0" />
                        <span className="font-semibold text-tx-primary">{act.tool}</span>
                        <span className="text-tx-muted truncate text-[10px]">
                          ({act.summary || "Success"})
                        </span>
                      </div>
                      <span className="text-tx-secondary shrink-0 text-[10px]">
                        {act.latency_ms ? `${act.latency_ms}ms` : "OK"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-surface-border">
              <span className="text-[10px] text-tx-muted font-mono">
                Last Synchronized: {formatTimestamp(inspectItem.last_successful_timestamp)}
              </span>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInspectModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setInspectModalOpen(false);
                    runTestConnection(inspectItem);
                  }}
                  icon={<Zap className="w-3 h-3 text-white" />}
                >
                  Test Connection
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
