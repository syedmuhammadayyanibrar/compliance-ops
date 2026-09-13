export interface AuditSummary {
  id: string;
  ai_system_id: string;
  user_goal: string;
  status: "pending" | "running" | "awaiting_approval" | "completed" | "failed";
  readiness_score: number | null;
  risk_score: number | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface AuditEvent {
  id?: string;
  run_id?: string;
  step: string;
  agent: string;
  tool: string | null;
  input: any;
  output: any;
  status: string;
  latency: number;
  verified: boolean;
  timestamp: string;
}

export interface AuditDetail {
  id: string;
  ai_system_id: string;
  user_goal: string;
  status: string;
  readiness_score: number | null;
  risk_score: number | null;
  classification?: {
    system_type: string;
    risk_category: string;
    assessment_scope: string[];
    rationale?: string;
  };
  investigation_plan?: Array<{
    step_id: string;
    domain: string;
    requirement_focus: string;
    evidence_needed: string;
    source: string;
    analysis_approach: string;
  }>;
  final_report?: any;
  started_at: string | null;
  completed_at: string | null;
}

export interface EvidenceItem {
  id: string;
  run_id: string;
  requirement_id?: string;
  source: "github" | "google_drive" | "slack" | "linear" | string;
  repository?: string;
  location: string;
  locator?: string;
  content: string;
  relevance_score: number;
  retrieved_at: string;
}

export interface RemediationTaskItem {
  id: string;
  finding_id?: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL" | string;
  owner?: string;
  status: "proposed" | "pending_approval" | "created" | "verified" | "failed" | string;
  external_system: string;
  external_id?: string;
  external_url?: string;
}

export interface FindingItem {
  id: string;
  run_id?: string;
  requirement_id: string;
  status: "PASS" | "PARTIAL" | "FAIL" | "UNKNOWN";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  reason: string;
  confidence: number;
  missing_controls: string[];
  remediation?: string;
  remediation_tasks?: RemediationTaskItem[];
}

export interface ApprovalItem {
  id: string;
  run_id: string;
  task_id: string;
  action_type: "READ" | "WRITE" | "DESTRUCTIVE" | string;
  action_summary: string;
  status: "pending" | "approved" | "rejected" | "timed_out" | string;
  reviewer: string | null;
  decision_reason: string | null;
  created_at: string;
  resolved_at: string | null;
  task?: {
    title: string;
    priority: string;
    description: string;
  };
}

export type MCPConnectionStatus = "Needs Setup" | "Connected" | "Verified" | "Degraded" | "Disconnected";

export interface MCPActivityItem {
  tool: string;
  status: "success" | "failed";
  timestamp?: string | null;
  latency_ms?: number;
  summary?: string;
}

export interface IntegrationInfo {
  id: string;
  name: string;
  provider_type: string;
  mcp_server_name?: string;
  is_connected: boolean;
  connection_status?: MCPConnectionStatus;
  verification_status?: "Verified" | "Unverified";
  available_tools?: string[];
  last_successful_call?: string | null;
  last_successful_timestamp?: string | null;
  response_time_ms?: number | null;
  retrieved_resource?: string | null;
  resource_metadata?: Record<string, any> | null;
  recent_activity?: MCPActivityItem[];
  status: string;
  last_sync_at?: string;
  config?: Record<string, any>;
}

export interface MCPTestResult {
  id: string;
  name: string;
  mcp_server_name: string;
  connection_status: MCPConnectionStatus;
  verification_status: "Verified" | "Unverified";
  operation: string;
  latency_ms: number;
  timestamp: string;
  resource_label: string;
  resource_retrieved: string;
  resource_metadata: Record<string, any>;
  available_tools: string[];
  recent_activity: MCPActivityItem[];
}

export interface EvaluationMetrics {
  tool_selection_accuracy: number;
  evidence_accuracy: number;
  finding_accuracy: number;
  task_completion: number;
  recovery_rate: number;
  safety: number;
  citation_coverage: number;
  end_to_end_latency: number;
}

export interface ScenarioResult {
  scenario_id: string;
  name: string;
  passed: boolean;
  latency: number;
  tool_accuracy: number;
  finding_accuracy: number;
  evidence_accuracy: number;
  safety_complied: boolean;
  citation_coverage: number;
  recovered: boolean;
}

export interface EvaluationSummary {
  total_scenarios: number;
  passed_scenarios: number;
  metrics: EvaluationMetrics;
  scenarios: ScenarioResult[];
  evaluated_at: string;
}

export interface ReportItem {
  id: string;
  audit_id: string;
  ai_system_id: string;
  name: string;
  scope: string;
  readiness_score: number;
  risk_score: number;
  status: string;
  findings_count: number;
  remediations_count: number;
  generated_at: string;
  download_url: string;
}

export interface ActivityEvent {
  id: string;
  run_id: string;
  system_name: string;
  step: string;
  agent: string;
  tool: string | null;
  title: string;
  description: string;
  status: string;
  latency: number;
  verified: boolean;
  type: "system" | "evidence" | "finding" | "approval" | "action" | "success" | "info";
  timestamp: string;
}

export interface SettingsConfig {
  organization_name: string;
  compliance_officer: string;
  strict_approval_gate: boolean;
  auto_approve_low_risk: boolean;
  model_provider: string;
  model_name: string;
  has_gemini_key: boolean;
  notification_channel: string;
  target_frameworks: string[];
  system_status: string;
  active_version: string;
}
