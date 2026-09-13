"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Shield,
  Menu,
  HelpCircle,
  X,
  FileCheck2,
  AlertCircle,
  Cpu,
  Layers,
  CheckCircle2,
  FileText,
  Sliders,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface TopbarProps {
  onMenuToggle?: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: "page" | "system" | "requirement";
  href: string;
  badge?: string;
}

const SEARCHABLE_ITEMS: SearchItem[] = [
  // Pages
  {
    id: "page-findings",
    title: "Compliance Findings & Gap Analysis",
    subtitle: "Triage non-compliant controls and missing statutory evidence",
    category: "page",
    href: "/findings",
    badge: "Gaps",
  },
  {
    id: "page-evidence",
    title: "Evidence Ledger & Provenance",
    subtitle: "Inspect verbatim excerpts from GitHub & Google Drive MCP",
    category: "page",
    href: "/evidence",
    badge: "Ledger",
  },
  {
    id: "page-approvals",
    title: "Human-in-the-Loop Policy Gate Queue",
    subtitle: "Review dual-key approval requests for external writes & Linear tickets",
    category: "page",
    href: "/approvals",
    badge: "HITL",
  },
  {
    id: "page-evaluations",
    title: "Reliability Benchmark Suite",
    subtitle: "Test 7 deterministic evaluation scenarios & safety policies",
    category: "page",
    href: "/evaluations",
    badge: "Eval",
  },
  {
    id: "page-reports",
    title: "Official Compliance Dossiers",
    subtitle: "Export executive conformity assessment reports",
    category: "page",
    href: "/reports",
    badge: "Reports",
  },
  {
    id: "page-settings",
    title: "MCP Tool Connectors & Settings",
    subtitle: "Manage GitHub, Drive, Slack, Linear and LLM credentials",
    category: "page",
    href: "/settings",
    badge: "MCP",
  },

  // Statutory Requirements
  {
    id: "req-001",
    title: "REQ-EU-AI-001: Risk Management System",
    subtitle: "Article 9 — Continuous risk identification, estimation, and evaluation",
    category: "requirement",
    href: "/findings?search=REQ-EU-AI-001",
    badge: "Art. 9",
  },
  {
    id: "req-002",
    title: "REQ-EU-AI-002: Data Governance & Quality",
    subtitle: "Article 10 — Training, validation, and testing dataset examination",
    category: "requirement",
    href: "/findings?search=REQ-EU-AI-002",
    badge: "Art. 10",
  },
  {
    id: "req-003",
    title: "REQ-EU-AI-003: Technical Documentation",
    subtitle: "Article 11 — Annex IV conformity assessment documents & model cards",
    category: "requirement",
    href: "/findings?search=REQ-EU-AI-003",
    badge: "Art. 11",
  },
  {
    id: "req-004",
    title: "REQ-EU-AI-004: Record-Keeping & Automatic Logging",
    subtitle: "Article 12 — Traceability of AI operations throughout lifecycle",
    category: "requirement",
    href: "/findings?search=REQ-EU-AI-004",
    badge: "Art. 12",
  },
  {
    id: "req-005",
    title: "REQ-EU-AI-005: Transparency & User Instructions",
    subtitle: "Article 13 — Interpretable output, intended purpose, and limitations",
    category: "requirement",
    href: "/findings?search=REQ-EU-AI-005",
    badge: "Art. 13",
  },
  {
    id: "req-006",
    title: "REQ-EU-AI-006: Human Oversight & Dual-Key Gate",
    subtitle: "Article 14 — Operational kill-switches and review controls",
    category: "requirement",
    href: "/approvals",
    badge: "Art. 14",
  },
  {
    id: "req-007",
    title: "REQ-EU-AI-007: Accuracy, Robustness & Cybersecurity",
    subtitle: "Article 15 — Performance resilience against data poisoning & prompt injection",
    category: "requirement",
    href: "/findings?search=REQ-EU-AI-007",
    badge: "Art. 15",
  },
  {
    id: "req-008",
    title: "REQ-EU-AI-008: Serious Incident Reporting",
    subtitle: "Article 62 — Mandatory notification to national market surveillance authorities",
    category: "requirement",
    href: "/findings?search=REQ-EU-AI-008",
    badge: "Art. 62",
  },

  // AI Systems
  {
    id: "sys-customer-support",
    title: "customer-support-ai",
    subtitle: "Customer Support Copilot • High Readiness Benchmark (~87%)",
    category: "system",
    href: "/evidence?search=customer-support-ai",
    badge: "AI Asset",
  },
  {
    id: "sys-loan-predictor",
    title: "loan-default-predictor-v2",
    subtitle: "Credit Scoring System • High-Risk Annex III Financial AI",
    category: "system",
    href: "/findings?search=loan-default-predictor-v2",
    badge: "AI Asset",
  },
  {
    id: "sys-fraud-detection",
    title: "fraud-detection-ai",
    subtitle: "Financial Fraud Analytics • Missing Documentation Scenario",
    category: "system",
    href: "/findings?search=fraud-detection-ai",
    badge: "AI Asset",
  },
];

export function Topbar({ onMenuToggle }: TopbarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter items
  const cleanQuery = query.trim().toLowerCase();
  const filteredItems = cleanQuery
    ? SEARCHABLE_ITEMS.filter(
        (item) =>
          item.title.toLowerCase().includes(cleanQuery) ||
          item.subtitle.toLowerCase().includes(cleanQuery) ||
          item.badge?.toLowerCase().includes(cleanQuery)
      ).slice(0, 8)
    : SEARCHABLE_ITEMS.slice(0, 6);

  const handleSelect = (href: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(href);
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (cleanQuery) {
        if (filteredItems.length > 0) {
          handleSelect(filteredItems[0].href);
        } else {
          handleSelect(`/findings?search=${encodeURIComponent(query)}`);
        }
      }
    }
  };

  return (
    <header className="h-14 bg-white border-b border-surface-border sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile menu toggle + Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-1.5 rounded-lg text-tx-secondary hover:text-tx-primary hover:bg-surface-subtle"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Box */}
        <div ref={searchContainerRef} className="relative w-full max-w-sm hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-tx-muted pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDownInput}
            placeholder="Search AI systems, requirements, evidence... (Ctrl+K)"
            className="w-full h-8 pl-9 pr-8 text-xs bg-surface-subtle border border-surface-border rounded-lg text-tx-primary placeholder:text-tx-muted focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/20 focus:border-brand transition"
          />

          {query ? (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tx-muted hover:text-tx-primary p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden md:inline-flex items-center absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-tx-muted bg-white border border-surface-border rounded">
              Ctrl+K
            </kbd>
          )}

          {/* Interactive Floating Search Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-surface-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="p-2 border-b border-surface-border bg-surface-subtle/50 flex items-center justify-between text-[11px] text-tx-muted">
                <span>{cleanQuery ? `Results for "${query}"` : "Suggested Quick Access"}</span>
                <span className="font-mono text-[10px]">Press ↵ to open</span>
              </div>

              <div className="max-h-80 overflow-y-auto p-1.5 space-y-1">
                {filteredItems.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-xs text-tx-muted">No exact match found.</p>
                    <button
                      onClick={() => handleSelect(`/findings?search=${encodeURIComponent(query)}`)}
                      className="mt-2 text-xs text-brand font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Search all findings for &quot;{query}&quot;
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.href)}
                      className="w-full text-left p-2 rounded-lg hover:bg-surface-subtle transition flex items-start justify-between gap-2 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-tx-primary group-hover:text-brand transition-colors truncate">
                            {item.title}
                          </span>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-subtle text-tx-secondary border border-surface-border shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-tx-secondary truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-tx-muted group-hover:text-brand opacity-0 group-hover:opacity-100 transition shrink-0 mt-1" />
                    </button>
                  ))
                )}
              </div>

              {cleanQuery && (
                <div className="p-2 border-t border-surface-border bg-surface-subtle/60 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => handleSelect(`/findings?search=${encodeURIComponent(query)}`)}
                    className="text-brand font-medium hover:underline flex items-center gap-1"
                  >
                    Deep search Findings for &quot;{query}&quot;
                  </button>
                  <button
                    onClick={() => handleSelect(`/evidence?search=${encodeURIComponent(query)}`)}
                    className="text-brand font-medium hover:underline flex items-center gap-1"
                  >
                    Deep search Evidence for &quot;{query}&quot;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Environment Badge & Tools */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-brand text-xs font-medium">
          <Shield className="w-3.5 h-3.5" />
          <span>EU AI Act High-Risk Annex III</span>
        </div>

        <div className="h-4 w-px bg-surface-border hidden sm:block" />

        <button
          className="p-1.5 rounded-lg text-tx-secondary hover:text-tx-primary hover:bg-surface-subtle relative"
          title="Notifications"
          onClick={() => router.push("/approvals")}
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-status-danger absolute top-1.5 right-1.5" />
        </button>

        <a
          href="/settings"
          className="p-1.5 rounded-lg text-tx-secondary hover:text-tx-primary hover:bg-surface-subtle hidden sm:block"
          title="Help & Framework Info"
        >
          <HelpCircle className="w-4 h-4" />
        </a>
      </div>
    </header>
  );
}
