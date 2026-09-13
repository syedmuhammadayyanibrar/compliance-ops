import os
import sys
import asyncio
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.api.main import app
from db.session import init_db, SessionLocal
from db.models import AISystem, Requirement, AgentRun, Approval
from agent.policies.safety_controller import SafetyPolicyController, ActionRiskLevel
from agent.graph.state import ComplianceState
from agent.graph.workflow import run_audit_workflow, resume_audit_workflow

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    init_db()

def test_database_initialization():
    db = SessionLocal()
    try:
        cs_ai = db.query(AISystem).filter(AISystem.id == "customer-support-ai").first()
        assert cs_ai is not None
        assert cs_ai.system_type == "generative_ai"

        reqs = db.query(Requirement).all()
        assert len(reqs) >= 8
    finally:
        db.close()

def test_safety_policy_controller_rules():
    controller = SafetyPolicyController(enforce_strict=True)

    # Test READ action
    req_appr, reason, ticket = controller.evaluate_action_policy("github.search", {})
    assert req_appr is False
    assert controller.classify_action("github.search") == ActionRiskLevel.READ

    # Test WRITE action (Linear task creation)
    req_appr, reason, ticket = controller.evaluate_action_policy(
        "linear.create_issue", 
        {"title": "Fix monitoring gap", "priority": "HIGH"}
    )
    assert req_appr is True
    assert ticket is not None
    assert ticket["priority"] == "HIGH"
    assert "requires human authorization" in reason

def test_fastapi_integrations_endpoint():
    response = client.get("/api/integrations")
    assert response.status_code == 200
    integrations = response.json()
    assert len(integrations) >= 4
    ids = [i["id"] for i in integrations]
    assert "github" in ids
    assert "google_drive" in ids
    assert "slack" in ids
    assert "linear" in ids

def test_evaluations_endpoint():
    response = client.get("/api/evaluations")
    assert response.status_code == 200
    data = response.json()
    assert data["total_scenarios"] == 7
    assert data["passed_scenarios"] == 7
    metrics = data["metrics"]
    assert metrics["safety"] == 100.0
    assert metrics["task_completion"] == 100.0

@pytest.mark.asyncio
async def test_end_to_end_audit_workflow_and_approval():
    # 1. Start audit workflow
    state: ComplianceState = {
        "run_id": "test-e2e-run-001",
        "user_goal": "Assess whether customer support AI is ready for deployment",
        "system_id": "customer-support-ai",
        "classification": {},
        "requirements": [],
        "investigation_plan": [],
        "evidence": [],
        "findings": [],
        "remediation_tasks": [],
        "pending_approval": None,
        "approvals": [],
        "tool_results": [],
        "verification_results": [],
        "final_report": {},
        "errors": []
    }

    result = await run_audit_workflow(state)

    # 2. Verify findings and evidence gathered
    assert len(result["evidence"]) > 0
    assert len(result["findings"]) > 0
    
    # Check that the gap in monitoring was caught
    monitoring_finding = next(
        (f for f in result["findings"] if f["requirement_id"] == "REQ-EU-AI-007"),
        None
    )
    assert monitoring_finding is not None
    assert monitoring_finding["status"] == "PARTIAL"
    assert "monitoring ownership" in monitoring_finding["missing_controls"]

    # 3. Verify that the Safety Controller strictly paused for approval
    assert result["pending_approval"] is not None
    assert result["pending_approval"]["priority"] == "HIGH"
    task_id = result["pending_approval"]["task_id"]

    # 4. Resolve approval with human sign-off
    approval_decision = {
        "task_id": task_id,
        "status": "approved",
        "reviewer": "compliance_lead@nexus.internal"
    }
    completed_state = await resume_audit_workflow(result, approval_decision)

    # 5. Verify task was created in Linear and independently verified
    approved_task = next(
        (t for t in completed_state["remediation_tasks"] if t["id"] == task_id),
        None
    )
    assert approved_task is not None
    assert approved_task["status"] == "verified"
    assert approved_task["external_id"] is not None
    assert approved_task["external_id"].startswith("LIN-")

    # 6. Verify final audit report
    report = completed_state["final_report"]
    assert report["readiness_score"] > 0
    assert report["citation_coverage"] > 0
