"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { api } from "../../services/api";

interface LaunchAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuditStarted?: (auditId: string) => void;
}

const PRESET_SYSTEMS = [
  {
    id: "loan-default-predictor-v2",
    name: "loan-default-predictor-v2",
    tag: "Credit Scoring",
    risk: "High Risk Annex III",
    desc: "Financial credit risk assessment. Triggers dual-key human approval gate.",
  },
  {
    id: "customer-support-ai",
    name: "customer-support-ai",
    tag: "Support Copilot",
    risk: "High Readiness Demo",
    desc: "Complete documentation benchmark showing ~87% readiness.",
  },
  {
    id: "fraud-detection-ai",
    name: "fraud-detection-ai",
    tag: "Fraud Analytics",
    risk: "Adversarial Gaps",
    desc: "Missing cybersecurity documentation scenario testing gap detection.",
  },
  {
    id: "applicant-screening-llm",
    name: "applicant-screening-llm",
    tag: "Recruitment / HR",
    risk: "High Risk Annex III",
    desc: "CV parsing & automated ranking under Article 6 & Annex III.",
  },
];

export function LaunchAuditModal({
  isOpen,
  onClose,
  onAuditStarted,
}: LaunchAuditModalProps) {
  const router = useRouter();

  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [selectedPreset, setSelectedPreset] = useState(PRESET_SYSTEMS[0].id);
  const [customSystemId, setCustomSystemId] = useState("");
  const [userGoal, setUserGoal] = useState(
    "Perform full EU AI Act Annex III High-Risk compliance audit, evaluate model governance, and synthesize remediation tasks."
  );
  const [framework, setFramework] = useState("eu-ai-act");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveSystemId =
    mode === "preset" ? selectedPreset : customSystemId.trim();

  const handleStartAudit = async () => {
    if (!effectiveSystemId) {
      setError("Please provide a valid AI System or Repository identifier.");
      return;
    }

    try {
      setStarting(true);
      setError(null);
      const res = await api.createAudit(effectiveSystemId, userGoal);
      onClose();
      if (onAuditStarted) {
        onAuditStarted(res.id);
      } else {
        router.push(`/audits/${res.id}`);
      }
    } catch (err: any) {
      console.error("Failed to start audit:", err);
      setError(
        err?.message ||
          "Failed to initiate audit run. Please check that the backend API is reachable."
      );
    } finally {
      setStarting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Launch Autonomous AI Compliance Audit"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        <p className="text-xs text-tx-secondary">
          Initiate an autonomous multi-agent compliance investigation. The system will retrieve technical evidence, evaluate mandatory EU AI Act articles, and enforce safety policy gates.
        </p>

        {error && (
          <div className="p-3 rounded-lg bg-status-danger-bg border border-[#FECDCA] text-status-danger text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Target Asset Mode Selector */}
        <div>
          <label className="block text-xs font-semibold text-tx-primary mb-1.5">
            Target AI Asset / Repository
          </label>

          <div className="flex rounded-lg bg-surface-subtle p-1 border border-surface-border mb-2.5">
            <button
              type="button"
              onClick={() => setMode("preset")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                mode === "preset"
                  ? "bg-white text-tx-primary shadow-xs"
                  : "text-tx-secondary hover:text-tx-primary"
              }`}
            >
              Pre-configured Systems
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                mode === "custom"
                  ? "bg-white text-tx-primary shadow-xs"
                  : "text-tx-secondary hover:text-tx-primary"
              }`}
            >
              Custom Project / Repo
            </button>
          </div>

          {mode === "preset" ? (
            <div className="space-y-2">
              <select
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value)}
                className="w-full text-xs bg-white border border-surface-border rounded-lg p-2.5 text-tx-primary font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              >
                {PRESET_SYSTEMS.map((sys) => (
                  <option key={sys.id} value={sys.id}>
                    {sys.name} ({sys.tag} • {sys.risk})
                  </option>
                ))}
              </select>

              <div className="text-[11px] text-tx-muted p-2 rounded bg-surface-subtle border border-surface-border">
                {PRESET_SYSTEMS.find((s) => s.id === selectedPreset)?.desc}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <input
                type="text"
                value={customSystemId}
                onChange={(e) => setCustomSystemId(e.target.value)}
                placeholder="e.g. org/model-repo, customer-churn-v1, or local folder path"
                className="w-full text-xs bg-white border border-surface-border rounded-lg p-2.5 text-tx-primary placeholder:text-tx-muted focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
              <p className="text-[11px] text-tx-muted">
                Tip: Enter your GitHub repo name (e.g. <code className="text-tx-primary font-mono">my-org/loan-model</code>) or local folder ID to audit your personal project files.
              </p>
            </div>
          )}
        </div>

        {/* Regulatory Scope */}
        <div>
          <label className="block text-xs font-semibold text-tx-primary mb-1">
            Governing Regulatory Framework
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "eu-ai-act", label: "EU AI Act", badge: "Annex III High-Risk" },
              { id: "iso-42001", label: "ISO/IEC 42001", badge: "AIMS Standard" },
              { id: "nist-ai-rmf", label: "NIST AI RMF", badge: "Govern / Map" },
            ].map((fw) => (
              <button
                key={fw.id}
                type="button"
                onClick={() => setFramework(fw.id)}
                className={`p-2 rounded-lg border text-left transition ${
                  framework === fw.id
                    ? "border-brand bg-blue-50/60 ring-1 ring-brand"
                    : "border-surface-border bg-white hover:bg-surface-subtle"
                }`}
              >
                <div className="font-semibold text-xs text-tx-primary">
                  {fw.label}
                </div>
                <div className="text-[10px] text-tx-muted truncate">
                  {fw.badge}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Audit Scope Directive */}
        <div>
          <label className="block text-xs font-semibold text-tx-primary mb-1">
            Audit Scope & Directive
          </label>
          <textarea
            rows={2}
            value={userGoal}
            onChange={(e) => setUserGoal(e.target.value)}
            className="w-full text-xs bg-white border border-surface-border rounded-lg p-2 text-tx-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none font-sans"
          />
        </div>

        {/* Pipeline Preview */}
        <div className="p-3 bg-surface-subtle border border-surface-border rounded-lg text-[11px] text-tx-secondary space-y-1">
          <div className="font-semibold text-tx-primary flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
            Autonomous Multi-Agent Audit Stages:
          </div>
          <div className="pl-5 text-tx-muted space-y-0.5">
            <div>1. System classification & Annex III rule retrieval</div>
            <div>2. Multi-agent MCP evidence collection (GitHub & Google Drive)</div>
            <div>3. Deterministic compliance gap evaluation</div>
            <div>4. Human-in-the-Loop policy gate for remediation tasks</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={starting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleStartAudit}
            loading={starting}
            icon={<Play className="w-3.5 h-3.5 fill-white" />}
          >
            {starting ? "Starting Audit..." : "Launch Autonomous Audit"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
