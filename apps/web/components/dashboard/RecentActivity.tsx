"use client";

import React, { useState, useEffect } from "react";
import { ActivityEvent } from "../../types";
import { api } from "../../services/api";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Search,
  Bot,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadActivity() {
    try {
      setRefreshing(true);
      const data = await api.getActivity(8);
      setActivities(data);
    } catch (err) {
      console.error("Failed to load activity:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadActivity();
    const interval = setInterval(loadActivity, 15000);
    return () => clearInterval(interval);
  }, []);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "finding":
        return <AlertCircle className="w-4 h-4 text-status-warning" />;
      case "approval":
        return <ShieldAlert className="w-4 h-4 text-brand" />;
      case "evidence":
        return <Search className="w-4 h-4 text-blue-500" />;
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-status-success" />;
      default:
        return <Bot className="w-4 h-4 text-tx-secondary" />;
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const date = new Date(ts);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return ts;
    }
  };

  return (
    <div className="bg-white border border-surface-border rounded-xl p-5 shadow-card flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-surface-border/60 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-semibold text-tx-primary">
            Audit Activity Ledger
          </h3>
        </div>
        <button
          onClick={loadActivity}
          disabled={refreshing}
          className="p-1 rounded text-tx-muted hover:text-tx-primary hover:bg-surface-subtle transition"
          title="Refresh activity"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Activity List */}
      <div className="flex-1 space-y-3 overflow-y-auto max-h-80 pr-1">
        {loading ? (
          <div className="py-8 text-center text-xs text-tx-muted">
            Loading recent compliance events...
          </div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-tx-muted">
            No recent activity recorded yet. Run an audit to populate the ledger.
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-3 p-2.5 rounded-lg border border-surface-border/50 hover:bg-surface-subtle transition-colors text-xs"
            >
              <div className="p-1.5 rounded-md bg-surface-subtle border border-surface-border/60 mt-0.5">
                {getEventIcon(act.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-tx-primary truncate">
                    {act.title}
                  </span>
                  <span className="text-[10px] text-tx-muted font-mono whitespace-nowrap">
                    {formatTimestamp(act.timestamp)}
                  </span>
                </div>

                <p className="text-tx-secondary text-[11px] mt-0.5 line-clamp-2">
                  {act.description}
                </p>

                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-subtle text-tx-secondary border border-surface-border font-mono">
                    {act.agent || "System"}
                  </span>

                  {act.system_name && (
                    <span className="text-[10px] text-tx-muted truncate">
                      {act.system_name}
                    </span>
                  )}

                  {act.run_id && (
                    <Link
                      href={`/audits/${act.run_id}`}
                      className="ml-auto text-[10px] text-brand hover:underline flex items-center gap-0.5"
                    >
                      Audit Run
                      <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-surface-border/60 flex items-center justify-between text-xs text-tx-muted">
        <span>Immutable audit trail</span>
        <Link href="/evidence" className="text-brand hover:underline font-medium">
          View all evidence →
        </Link>
      </div>
    </div>
  );
}
