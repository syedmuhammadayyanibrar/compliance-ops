import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import (
    Column,
    String,
    Text,
    Float,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    Enum as SQLEnum,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=utc_now)

    ai_systems = relationship("AISystem", back_populates="organization")

class AISystem(Base):
    __tablename__ = "ai_systems"

    id = Column(String(64), primary_key=True)  # e.g., "customer-support-ai"
    name = Column(String(255), nullable=False)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    system_type = Column(String(64), default="generative_ai")
    risk_category = Column(String(32), default="high")
    description = Column(Text, nullable=True)
    repository_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    organization = relationship("Organization", back_populates="ai_systems")
    agent_runs = relationship("AgentRun", back_populates="ai_system")

class Requirement(Base):
    __tablename__ = "requirements"

    id = Column(String(64), primary_key=True)  # e.g. "REQ-EU-AI-001"
    framework = Column(String(64), default="EU AI Act")
    article = Column(String(64), nullable=False)
    provision = Column(String(255), nullable=False)
    requirement = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    jurisdiction = Column(String(64), default="European Union")
    effective_date = Column(String(32), default="2026-08-02")
    source_url = Column(String(512), nullable=True)
    domain = Column(String(64), nullable=False)
    mandatory_controls = Column(JSON, default=list)
    embedding = Column(JSON, nullable=True)  # Stored as JSON array of floats for cross-DB compatibility

class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ai_system_id = Column(String(64), ForeignKey("ai_systems.id"), nullable=False)
    user_goal = Column(Text, nullable=False)
    status = Column(String(32), default="pending")  # pending, running, awaiting_approval, completed, failed
    risk_score = Column(Float, nullable=True)
    readiness_score = Column(Float, nullable=True)
    classification = Column(JSON, nullable=True)
    investigation_plan = Column(JSON, nullable=True)
    final_report = Column(JSON, nullable=True)
    started_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)

    ai_system = relationship("AISystem", back_populates="agent_runs")
    events = relationship("AgentEvent", back_populates="run", cascade="all, delete-orphan")
    evidence_items = relationship("Evidence", back_populates="run", cascade="all, delete-orphan")
    findings = relationship("FindingModel", back_populates="run", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="run", cascade="all, delete-orphan")

class AgentEvent(Base):
    __tablename__ = "agent_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("agent_runs.id"), nullable=False)
    step = Column(String(64), nullable=False)
    agent = Column(String(64), nullable=False)
    tool = Column(String(64), nullable=True)
    input = Column(JSON, nullable=True)
    output = Column(JSON, nullable=True)
    status = Column(String(32), default="success")  # success, error, blocked, pending
    latency = Column(Float, default=0.0)  # in seconds
    verified = Column(Boolean, default=True)
    timestamp = Column(DateTime, default=utc_now)

    run = relationship("AgentRun", back_populates="events")

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("agent_runs.id"), nullable=False)
    requirement_id = Column(String(64), ForeignKey("requirements.id"), nullable=True)
    source = Column(String(64), nullable=False)  # github, google_drive, slack, linear
    external_id = Column(String(255), nullable=True)
    location = Column(String(512), nullable=False)  # path or URL
    locator = Column(String(255), nullable=True)  # e.g., "section: monitoring"
    content = Column(Text, nullable=False)
    relevance_score = Column(Float, default=0.0)
    retrieved_at = Column(DateTime, default=utc_now)

    run = relationship("AgentRun", back_populates="evidence_items")
    finding_associations = relationship("FindingEvidence", back_populates="evidence")

class FindingModel(Base):
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("agent_runs.id"), nullable=False)
    requirement_id = Column(String(64), ForeignKey("requirements.id"), nullable=False)
    status = Column(String(16), nullable=False)  # PASS, PARTIAL, FAIL, UNKNOWN
    severity = Column(String(16), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    title = Column(String(255), nullable=False)
    reason = Column(Text, nullable=False)
    confidence = Column(Float, default=0.0)
    missing_controls = Column(JSON, default=list)
    remediation = Column(Text, nullable=True)

    run = relationship("AgentRun", back_populates="findings")
    remediation_tasks = relationship("RemediationTask", back_populates="finding", cascade="all, delete-orphan")
    evidence_associations = relationship("FindingEvidence", back_populates="finding")

class FindingEvidence(Base):
    __tablename__ = "finding_evidence"

    finding_id = Column(String(36), ForeignKey("findings.id"), primary_key=True)
    evidence_id = Column(String(36), ForeignKey("evidence.id"), primary_key=True)

    finding = relationship("FindingModel", back_populates="evidence_associations")
    evidence = relationship("Evidence", back_populates="finding_associations")

class RemediationTask(Base):
    __tablename__ = "remediation_tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    finding_id = Column(String(36), ForeignKey("findings.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(16), default="HIGH")  # LOW, MEDIUM, HIGH, URGENT
    owner = Column(String(128), default="ai-compliance-lead")
    status = Column(String(32), default="proposed")  # proposed, pending_approval, approved, rejected, created, verified, failed
    external_system = Column(String(32), default="linear")
    external_id = Column(String(64), nullable=True)  # e.g., "LIN-1042"
    external_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    verified_at = Column(DateTime, nullable=True)

    finding = relationship("FindingModel", back_populates="remediation_tasks")
    approvals = relationship("Approval", back_populates="remediation_task")

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("agent_runs.id"), nullable=False)
    task_id = Column(String(36), ForeignKey("remediation_tasks.id"), nullable=True)
    action_type = Column(String(32), default="WRITE")  # READ, WRITE, DESTRUCTIVE
    action_summary = Column(Text, nullable=False)
    status = Column(String(32), default="pending")  # pending, approved, rejected, timed_out
    reviewer = Column(String(128), nullable=True)
    decision_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    resolved_at = Column(DateTime, nullable=True)

    run = relationship("AgentRun", back_populates="approvals")
    remediation_task = relationship("RemediationTask", back_populates="approvals")

class IntegrationSetting(Base):
    __tablename__ = "integrations"

    id = Column(String(64), primary_key=True)  # github, google_drive, slack, linear
    name = Column(String(64), nullable=False)
    provider_type = Column(String(32), default="mcp")  # mcp, rest, mock
    is_connected = Column(Boolean, default=True)
    status = Column(String(32), default="operational")
    last_sync_at = Column(DateTime, default=utc_now)
    config = Column(JSON, default=dict)

class EvaluationRecord(Base):
    __tablename__ = "evaluations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    scenario_id = Column(String(64), nullable=False)
    scenario_name = Column(String(128), nullable=False)
    passed = Column(Boolean, default=False)
    metrics = Column(JSON, default=dict)
    run_output = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=utc_now)
