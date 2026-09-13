"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  Shield,
  Key,
  Server,
  Bell,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Lock,
  Cpu,
} from "lucide-react";
import { api } from "../../services/api";
import { SettingsConfig } from "../../types";
import { Button } from "../../components/ui/Button";
import { IntegrationsTable } from "../../components/dashboard/IntegrationsTable";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsConfig | null>(null);
  const [activeTab, setActiveTab] = useState<"governance" | "llm" | "mcp" | "frameworks">("governance");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [strictApproval, setStrictApproval] = useState(true);
  const [autoApproveLowRisk, setAutoApproveLowRisk] = useState(false);
  const [modelName, setModelName] = useState("gemini-1.5-flash");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [slackChannel, setSlackChannel] = useState("#ai-compliance-approvals");

  async function loadSettings() {
    try {
      setLoading(true);
      const sData = await api.getSettings().catch(() => null);

      if (sData) {
        setSettings(sData);
        setStrictApproval(sData.strict_approval_gate);
        setAutoApproveLowRisk(sData.auto_approve_low_risk);
        setModelName(sData.model_name);
        setSlackChannel(sData.notification_channel);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.updateSettings({
        strict_approval_gate: strictApproval,
        auto_approve_low_risk: autoApproveLowRisk,
        model_name: modelName,
        notification_channel: slackChannel,
        gemini_api_key: geminiApiKey.trim() ? geminiApiKey.trim() : undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setGeminiApiKey("");
      await loadSettings();
    } catch (err) {
      console.error("Failed to save settings:", err);
      alert("Failed to save settings. Check backend connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-surface-border rounded-xl p-5 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-tx-primary tracking-tight">
              Governance & System Settings
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-surface-subtle text-tx-secondary border border-surface-border">
              Enterprise v1.2
            </span>
          </div>
          <p className="text-xs sm:text-sm text-tx-secondary mt-1">
            Configure human-in-the-loop policy gates, Google AI Studio LLM credentials, and MCP connector sandboxes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs text-status-success font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Settings Saved
            </span>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            loading={saving}
            icon={<Save className="w-3.5 h-3.5" />}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <div className="flex border-b border-surface-border bg-white rounded-t-xl px-4 pt-2">
        {[
          { id: "governance", label: "Policy & Human Gates", icon: Shield },
          { id: "llm", label: "AI Models & API Keys", icon: Key },
          { id: "mcp", label: "MCP Tool Connectors", icon: Server },
          { id: "frameworks", label: "Statutory Frameworks", icon: Cpu },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition -mb-px ${
                isActive
                  ? "border-brand text-brand"
                  : "border-transparent text-tx-secondary hover:text-tx-primary"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Cards */}
      <div className="bg-white border border-surface-border rounded-b-xl rounded-t-none p-6 shadow-card space-y-6">
        {/* Tab 1: Governance & Policy Gates */}
        {activeTab === "governance" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-sm font-semibold text-tx-primary">
                Deterministic Human-in-the-Loop Policy Gates
              </h3>
              <p className="text-xs text-tx-secondary mt-0.5">
                Controls the enforcement boundary for automated external write operations.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-surface-subtle border border-surface-border">
                <div>
                  <div className="font-semibold text-xs text-tx-primary">
                    Strict Dual-Key Policy Gate (Enforced)
                  </div>
                  <p className="text-xs text-tx-secondary mt-0.5 leading-relaxed">
                    Require explicit human authorization in the Approvals queue before allowing the agent to dispatch write actions (e.g. creating Linear issues, posting alerts).
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={strictApproval}
                  onChange={(e) => setStrictApproval(e.target.checked)}
                  className="w-4 h-4 rounded text-brand focus:ring-brand mt-1"
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-surface-subtle border border-surface-border">
                <div>
                  <div className="font-semibold text-xs text-tx-primary">
                    Auto-Approve Low-Risk Informational Actions
                  </div>
                  <p className="text-xs text-tx-secondary mt-0.5 leading-relaxed">
                    Automatically bypass human approval for read-only actions and low-priority documentation indexing.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoApproveLowRisk}
                  onChange={(e) => setAutoApproveLowRisk(e.target.checked)}
                  className="w-4 h-4 rounded text-brand focus:ring-brand mt-1"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tx-primary mb-1">
                  Slack Notification Broadcast Channel
                </label>
                <input
                  type="text"
                  value={slackChannel}
                  onChange={(e) => setSlackChannel(e.target.value)}
                  className="w-full text-xs bg-white border border-surface-border rounded-lg p-2.5 text-tx-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono"
                  placeholder="#ai-compliance-approvals"
                />
                <p className="text-[11px] text-tx-muted mt-1">
                  Channel ID or name where Human-in-the-Loop approval requests are pushed in real time.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI Models & Keys */}
        {activeTab === "llm" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-sm font-semibold text-tx-primary">
                Google AI Studio & LLM Provider Configuration
              </h3>
              <p className="text-xs text-tx-secondary mt-0.5">
                Native Gemini integration with zero external SDK dependencies for autonomous reasoning and synthesis.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-tx-primary mb-1">
                  Selected Inference Model
                </label>
                <select
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full text-xs bg-white border border-surface-border rounded-lg p-2.5 text-tx-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono"
                >
                  <option value="gemini-2.0-flash">gemini-2.0-flash (Fast, Low Latency, Multimodal)</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Standard Enterprise Default)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (Deep Regulatory Reasoning)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-tx-primary mb-1">
                  Google AI Studio API Key (`GEMINI_API_KEY`)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder={
                      settings?.has_gemini_key
                        ? "•••••••••••••••••••••••••••••••• (API Key Active)"
                        : "Paste your Google AI Studio API key here (AIza...)"
                    }
                    className="w-full text-xs bg-white border border-surface-border rounded-lg p-2.5 text-tx-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono"
                  />
                  {settings?.has_gemini_key && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-status-success flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-tx-muted mt-1">
                  Obtain your free key from{" "}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand hover:underline font-medium inline-flex items-center gap-0.5"
                  >
                    Google AI Studio
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  . Keys are persisted in your local environment.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-tx-secondary space-y-1">
                <div className="font-semibold text-brand flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  Deterministic Offline Fallback Guarantee
                </div>
                <p className="text-tx-secondary">
                  If an API key is omitted or the connection is offline, the orchestration runtime automatically falls back to deterministic local rule engines so compliance audits never stall.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: MCP Tool Connectors */}
        {activeTab === "mcp" && (
          <div className="space-y-6">
            <IntegrationsTable showManageLink={false} />
          </div>
        )}

        {/* Tab 4: Statutory Frameworks */}
        {activeTab === "frameworks" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-sm font-semibold text-tx-primary">
                Target Statutory & AI Governance Frameworks
              </h3>
              <p className="text-xs text-tx-secondary mt-0.5">
                Active compliance standards mapped to autonomous evidence evaluation rules.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: "eu-ai-act",
                  title: "EU AI Act (Regulation EU 2024/1689)",
                  desc: "High-Risk AI Systems under Annex III. Evaluates Articles 9 (Risk Management), 10 (Data Governance), 11 (Technical Docs), 14 (Human Oversight), and 62.",
                  active: true,
                  badge: "Mandatory",
                },
                {
                  id: "iso-42001",
                  title: "ISO/IEC 42001 Artificial Intelligence Management System",
                  desc: "Requirements for establishing, implementing, maintaining and continually improving an AIMS within organizations.",
                  active: true,
                  badge: "International",
                },
                {
                  id: "nist-ai-rmf",
                  title: "NIST AI Risk Management Framework (AI RMF 1.0)",
                  desc: "Govern, Map, Measure, and Manage functions for trustworthiness, fairness, and safety.",
                  active: true,
                  badge: "US Standard",
                },
              ].map((fw) => (
                <div
                  key={fw.id}
                  className="p-4 rounded-xl border border-surface-border bg-white shadow-xs flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-tx-primary">
                        {fw.title}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-50 text-brand border border-blue-200">
                        {fw.badge}
                      </span>
                    </div>
                    <p className="text-xs text-tx-secondary mt-1 leading-relaxed">
                      {fw.desc}
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-status-success flex items-center gap-1 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" /> Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
