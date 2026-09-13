import {
  AuditSummary,
  AuditDetail,
  AuditEvent,
  EvidenceItem,
  FindingItem,
  ApprovalItem,
  IntegrationInfo,
  EvaluationSummary,
  ReportItem,
  ActivityEvent,
  SettingsConfig,
  MCPTestResult,
} from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`Fetch error at ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Audits
  async getAudits(): Promise<AuditSummary[]> {
    return fetchJson<AuditSummary[]>("/api/audits");
  },

  async getAudit(id: string): Promise<AuditDetail> {
    return fetchJson<AuditDetail>(`/api/audits/${id}`);
  },

  async createAudit(systemId: string, userGoal?: string): Promise<{ id: string; status: string }> {
    return fetchJson<{ id: string; status: string }>("/api/audits", {
      method: "POST",
      body: JSON.stringify({
        system_id: systemId,
        user_goal: userGoal || `Assess whether ${systemId} meets EU AI Act High-Risk requirements.`,
      }),
    });
  },

  async getAuditEvents(auditId: string): Promise<AuditEvent[]> {
    return fetchJson<AuditEvent[]>(`/api/audits/${auditId}/events`);
  },

  // Evidence
  async getEvidence(source?: string, systemId?: string): Promise<EvidenceItem[]> {
    const params = new URLSearchParams();
    if (source && source !== "all") params.append("source", source);
    if (systemId && systemId !== "all") params.append("system_id", systemId);
    const query = params.toString() ? `?${params.toString()}` : "";
    return fetchJson<EvidenceItem[]>(`/api/evidence${query}`);
  },

  async getAuditEvidence(auditId: string): Promise<EvidenceItem[]> {
    return fetchJson<EvidenceItem[]>(`/api/audits/${auditId}/evidence`);
  },

  // Findings
  async getFindings(status?: string, severity?: string): Promise<FindingItem[]> {
    const params = new URLSearchParams();
    if (status && status !== "ALL") params.append("status", status);
    if (severity && severity !== "ALL") params.append("severity", severity);
    const query = params.toString() ? `?${params.toString()}` : "";
    return fetchJson<FindingItem[]>(`/api/findings${query}`);
  },

  async getAuditFindings(auditId: string): Promise<FindingItem[]> {
    return fetchJson<FindingItem[]>(`/api/audits/${auditId}/findings`);
  },

  // Approvals
  async getApprovals(status?: string): Promise<ApprovalItem[]> {
    const query = status ? `?status=${status}` : "";
    return fetchJson<ApprovalItem[]>(`/api/approvals${query}`);
  },

  async resolveApproval(
    id: string,
    decision: "approve" | "reject",
    reviewer = "compliance_lead@nexus.internal",
    reason = "Resolved by compliance officer"
  ): Promise<any> {
    return fetchJson(`/api/approvals/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ decision, reviewer, reason }),
    });
  },

  // Integrations
  async getIntegrations(): Promise<IntegrationInfo[]> {
    return fetchJson<IntegrationInfo[]>("/api/integrations");
  },

  async testIntegration(id: string): Promise<MCPTestResult> {
    return fetchJson<MCPTestResult>(`/api/integrations/${id}/test`, {
      method: "POST",
    });
  },

  // Evaluations
  async getEvaluations(): Promise<EvaluationSummary> {
    return fetchJson<EvaluationSummary>("/api/evaluations");
  },

  async runEvaluations(): Promise<EvaluationSummary> {
    return fetchJson<EvaluationSummary>("/api/evaluations/run", {
      method: "POST",
    });
  },

  // Reports
  async getReports(): Promise<ReportItem[]> {
    return fetchJson<ReportItem[]>("/api/reports");
  },

  // Activity
  async getActivity(limit = 25): Promise<ActivityEvent[]> {
    return fetchJson<ActivityEvent[]>(`/api/activity?limit=${limit}`);
  },

  // Settings
  async getSettings(): Promise<SettingsConfig> {
    return fetchJson<SettingsConfig>("/api/settings");
  },

  async updateSettings(payload: Partial<SettingsConfig> & { gemini_api_key?: string }): Promise<any> {
    return fetchJson("/api/settings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
