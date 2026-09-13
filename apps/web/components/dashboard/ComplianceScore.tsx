"use client";

import React from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2, Award } from "lucide-react";

interface ComplianceScoreProps {
  score: number;
  riskScore: number;
  totalRequirements?: number;
  passedRequirements?: number;
  domainScores?: Record<string, number>;
}

export function ComplianceScore({
  score,
  riskScore,
  totalRequirements = 8,
  passedRequirements = 7,
  domainScores = {
    "Risk Management (Art. 9)": 92,
    "Data Governance (Art. 10)": 85,
    "Technical Documentation (Art. 11)": 88,
    "Record-Keeping & Logging (Art. 12)": 90,
    "Transparency & Information (Art. 13)": 82,
    "Human Oversight Controls (Art. 14)": 85,
    "Accuracy & Cybersecurity (Art. 15)": 94,
  },
}: ComplianceScoreProps) {
  // SVG circular gauge geometry
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (val: number) => {
    if (val === 0) return "text-tx-muted stroke-slate-200";
    if (val >= 80) return "text-status-success stroke-status-success";
    if (val >= 60) return "text-status-warning stroke-status-warning";
    return "text-status-danger stroke-status-danger";
  };

  const getBadgeColor = (val: number) => {
    if (val === 0) return "bg-surface-subtle text-tx-muted border-surface-border";
    if (val >= 80) return "bg-status-success-bg text-status-success border-[#C6F0DD]";
    if (val >= 60) return "bg-status-warning-bg text-status-warning border-[#FDE68A]";
    return "bg-status-danger-bg text-status-danger border-[#FECDCA]";
  };

  return (
    <div className="bg-white border border-surface-border rounded-xl p-5 shadow-card flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-border/60 pb-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-tx-primary">
            EU AI Act Statutory Readiness
          </h3>
          <p className="text-xs text-tx-secondary mt-0.5">
            Annex III Conformity Assessment Score
          </p>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeColor(
            score
          )}`}
        >
          {score === 0 ? "Awaiting Audit Run" : score >= 80 ? "Substantially Compliant" : score >= 60 ? "Remediation Required" : "Non-Compliant"}
        </span>
      </div>

      {/* Main Score Visual + Metrics */}
      <div className="flex items-center justify-around py-2">
        {/* Radial Progress Gauge */}
        <div className="relative flex items-center justify-center">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r={radius}
              className="stroke-surface-subtle"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              className={`${getScoreColor(score)} transition-all duration-1000 ease-out`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold text-tx-primary tracking-tight">
              {score}%
            </span>
            <span className="text-[10px] uppercase font-semibold text-tx-muted tracking-wider">
              Readiness
            </span>
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="space-y-3">
          <div className="p-2.5 rounded-lg bg-surface-subtle border border-surface-border/60">
            <div className="text-[11px] text-tx-secondary font-medium">
              Residual Risk Score
            </div>
            {(() => {
              const category =
                riskScore === 0
                  ? { label: "Not Evaluated", color: "text-tx-muted" }
                  : riskScore <= 3.0
                  ? { label: "Low", color: "text-status-success" }
                  : riskScore <= 6.9
                  ? { label: "Moderate", color: "text-[#B45309]" }
                  : { label: "High", color: "text-status-danger" };
              return (
                <div className={`text-lg font-bold ${category.color}`}>
                  {riskScore === 0 ? "—" : `${riskScore}/10`}
                  <span className="text-xs font-normal text-tx-muted ml-1">
                    ({category.label})
                  </span>
                </div>
              );
            })()}
          </div>

          <div className="p-2.5 rounded-lg bg-surface-subtle border border-surface-border/60">
            <div className="text-[11px] text-tx-secondary font-medium">
              Requirements Met
            </div>
            <div className="text-lg font-bold text-tx-primary">
              {score === 0 ? "0 / 8" : `${passedRequirements} / ${totalRequirements}`}
              <span className="text-xs font-normal text-tx-muted ml-1.5 font-medium">
                ({score === 0 ? "0%" : `${Math.round((passedRequirements / totalRequirements) * 100)}%`})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Domain Breakdown */}
      <div className="mt-4 pt-4 border-t border-surface-border/60">
        <h4 className="text-xs font-semibold text-tx-primary uppercase tracking-wider mb-2.5">
          Statutory Domain Breakdown
        </h4>
        <div className="space-y-2">
          {Object.entries(domainScores).map(([domain, val]) => (
            <div key={domain} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-tx-secondary truncate max-w-[220px]" title={domain}>
                  {domain}
                </span>
                <span className="font-semibold text-tx-primary">{val}%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-subtle rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    val >= 85 ? "bg-status-success" : val >= 70 ? "bg-brand" : "bg-status-warning"
                  }`}
                  style={{ width: `${val}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
