from typing import TypedDict, List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field

class Finding(BaseModel):
    requirement_id: str
    title: str
    status: Literal["PASS", "PARTIAL", "FAIL", "UNKNOWN"]
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    reason: str
    confidence: float
    evidence_ids: List[str] = Field(default_factory=list)
    missing_controls: List[str] = Field(default_factory=list)
    remediation: str = ""

class EvidenceItem(BaseModel):
    id: str
    requirement_id: Optional[str] = None
    source: str  # "github" | "google_drive" | "slack" | "linear"
    repository: Optional[str] = None
    path: str
    content: str
    locator: str  # e.g., "section: monitoring"
    retrieved_at: str
    relevance_score: float = 0.0

class RemediationPlanTask(BaseModel):
    id: str
    finding_id: str
    title: str
    description: str
    priority: Literal["LOW", "MEDIUM", "HIGH", "URGENT"]
    owner: str
    external_system: str = "linear"
    external_id: Optional[str] = None
    status: str = "proposed"

class ComplianceState(TypedDict):
    run_id: str
    user_goal: str
    system_id: str
    classification: Dict[str, Any]
    requirements: List[Dict[str, Any]]
    investigation_plan: List[Dict[str, Any]]
    evidence: List[Dict[str, Any]]
    findings: List[Dict[str, Any]]
    remediation_tasks: List[Dict[str, Any]]
    pending_approval: Optional[Dict[str, Any]]
    approvals: List[Dict[str, Any]]
    tool_results: List[Dict[str, Any]]
    verification_results: List[Dict[str, Any]]
    final_report: Dict[str, Any]
    errors: List[Dict[str, Any]]
