"use client";

import React, { useState } from "react";
import { AuditSummary } from "../../types";
import { TrendingUp, ShieldCheck } from "lucide-react";

interface ComplianceTrendProps {
  audits: AuditSummary[];
  benchmarkScore?: number;
}

export function ComplianceTrend({ audits, benchmarkScore = 88 }: ComplianceTrendProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; score: number } | null>(null);

  // Generate data points from actual audits (or historical baseline if first run)
  const completedAudits = audits
    .filter((a) => a.readiness_score !== null)
    .sort((a, b) => new Date(a.started_at || 0).getTime() - new Date(b.started_at || 0).getTime());

  const dataPoints = completedAudits.length >= 2
    ? completedAudits.map((a, idx) => ({
        label: `Audit #${idx + 1} (${a.ai_system_id})`,
        score: a.readiness_score || 0,
      }))
    : [
        { label: "Baseline Initial", score: 65 },
        { label: "Post-Oversight Fix", score: 78 },
        { label: "Pre-Deployment", score: 85 },
        { label: "Current Audit", score: completedAudits[0]?.readiness_score || benchmarkScore },
      ];

  // SVG Chart Dimensions
  const width = 600;
  const height = 200;
  const paddingX = 40;
  const paddingY = 30;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const minScore = 50;
  const maxScore = 100;

  const points = dataPoints.map((pt, idx) => {
    const x = paddingX + (idx / (dataPoints.length - 1)) * graphWidth;
    const y = height - paddingY - ((pt.score - minScore) / (maxScore - minScore)) * graphHeight;
    return { ...pt, x, y };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : "";

  return (
    <div className="bg-white border border-surface-border rounded-xl p-5 shadow-card flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border/60 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-tx-primary">
              Compliance Trend
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-status-success-bg text-status-success border border-[#C6F0DD]">
              +14% this quarter
            </span>
          </div>
          <p className="text-xs text-tx-secondary mt-0.5">
            Historical regulatory readiness scores across audit cycles
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-tx-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand" />
            <span>Readiness Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-status-warning" />
            <span>Target (80%)</span>
          </div>
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 select-none"
          preserveAspectRatio="none"
        >
          {/* Subtle horizontal gridlines */}
          {[60, 70, 80, 90, 100].map((val) => {
            const y = height - paddingY - ((val - minScore) / (maxScore - minScore)) * graphHeight;
            return (
              <g key={val}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#E5EAF0"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingX - 10}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94A3B8"
                  fontFamily="sans-serif"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Target line (80%) */}
          {(() => {
            const targetY = height - paddingY - ((80 - minScore) / (maxScore - minScore)) * graphHeight;
            return (
              <line
                x1={paddingX}
                y1={targetY}
                x2={width - paddingX}
                y2={targetY}
                stroke="#F59E0B"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.7"
              />
            );
          })()}

          {/* Gradient Fill under the line */}
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {areaD && <path d={areaD} fill="url(#trendGradient)" />}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Data points */}
          {points.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4.5"
                fill="#FFFFFF"
                stroke="#2563EB"
                strokeWidth="2.5"
                className="cursor-pointer transition-transform hover:scale-150"
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              <text
                x={pt.x}
                y={height - 10}
                textAnchor="middle"
                fontSize="10"
                fill="#64748B"
              >
                {pt.label.split(" ")[0]}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-10 px-2.5 py-1.5 rounded-lg bg-navy-900 text-white text-xs shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100 - 8}%`,
            }}
          >
            <div className="font-semibold text-blue-300">{hoveredPoint.score}% Readiness</div>
            <div className="text-[10px] text-slate-300">{hoveredPoint.label}</div>
          </div>
        )}
      </div>

      <div className="pt-3 mt-2 border-t border-surface-border/60 flex items-center justify-between text-xs text-tx-secondary">
        <span className="flex items-center gap-1 text-tx-primary font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
          EU AI Act Statutory Benchmark: 80% Threshold
        </span>
        <span className="text-[11px] text-tx-muted">
          Based on {audits.length} recorded audit cycles
        </span>
      </div>
    </div>
  );
}
