import os
import sys
import json
import asyncio
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

# Ensure UTF-8 output on Windows console
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from db.session import init_db
from agent.graph.state import ComplianceState
from agent.graph.workflow import run_audit_workflow, resume_audit_workflow
from evals.evaluator import ComplianceEvaluator

async def main():
    print("=" * 65)
    print(" COMPLIANCEOPS - AGENTIC AI COMPLIANCE AUDITOR (DEMO RUNNER)")
    print("=" * 65)
    
    # 1. Initialize Database
    print("\n[1/5] Initializing Database and Seeding Curated Knowledge Base...")
    init_db()
    print(" ✓ Database initialized and EU AI Act requirements loaded.")

    # 2. Run Evaluation Suite
    print("\n[2/5] Running Evaluation Benchmark Suite against 7 Scenarios...")
    evaluator = ComplianceEvaluator()
    summary = await evaluator.run_all()
    metrics = summary["metrics"]
    print(f" ✓ Scenarios Passed: {summary['passed_scenarios']}/{summary['total_scenarios']}")
    print(f" ✓ Safety Policy Compliance: {metrics['safety']}%")
    print(f" ✓ Task Completion Rate: {metrics['task_completion']}%")
    print(f" ✓ Finding Accuracy: {metrics['finding_accuracy']}%")
    print(f" ✓ Evidence Accuracy: {metrics['evidence_accuracy']}%")
    print(f" ✓ Recovery Rate: {metrics['recovery_rate']}%")

    # 3. Golden Demo Audit Run
    print("\n[3/5] Starting Golden Path Audit: customer-support-ai...")
    audit_state: ComplianceState = {
        "run_id": "golden-demo-run",
        "user_goal": "Assess whether Customer Support AI is ready for deployment under EU AI Act",
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

    step1 = await run_audit_workflow(audit_state)
    print(f" ✓ Classification: {step1['classification']['system_type']} ({step1['classification']['risk_category'].upper()} RISK)")
    print(f" ✓ Evidence Items Collected: {len(step1['evidence'])} artifacts from GitHub and Google Drive")
    print(f" ✓ Findings Produced: {len(step1['findings'])}")
    
    gap_finding = next((f for f in step1['findings'] if f['status'] == "PARTIAL"), None)
    if gap_finding:
        print(f" ⚠ Detected Compliance Gap: '{gap_finding['title']}'")
        print(f"   Missing Controls: {', '.join(gap_finding['missing_controls'])}")
        print(f"   Confidence Score: {gap_finding['confidence'] * 100}%")

    # 4. Safety / Policy Controller Check
    print("\n[4/5] Safety / Policy Controller Evaluation...")
    pending = step1.get("pending_approval")
    if pending:
        print(f" 🚨 STRICT POLICY GATE TRIGGERED:")
        print(f"   Action: {pending['summary']}")
        print(f"   Priority: {pending['priority']}")
        print(f"   Status: Awaiting Human Authorization (Autonomous write BLOCKED)")

    # 5. Human Sign-Off & Verification
    print("\n[5/5] Simulating Human Approval & External Linear Verification...")
    approval_decision = {
        "task_id": pending["task_id"],
        "status": "approved",
        "reviewer": "compliance_lead@nexus.internal"
    }
    completed_state = await resume_audit_workflow(step1, approval_decision)

    verified_task = next((t for t in completed_state["remediation_tasks"] if t.get("status") == "verified"), None)
    if verified_task:
        print(f" ✓ Linear Issue Created: {verified_task['external_id']}")
        print(f" ✓ Verification Node Check: PASSED (Issue confirmed in Linear)")

    report = completed_state["final_report"]
    print("\n" + "=" * 65)
    print(f" AUDIT COMPLETE - READINESS SCORE: {report['readiness_score']}% | RISK: {report['risk_score']}/10")
    print(f" Citation Coverage: {report['citation_coverage']}%")
    print("=" * 65)
    print("\nTo launch the interactive Web Dashboard:")
    print(" 1. Run: .venv\\Scripts\\uvicorn services.api.main:app --port 8000")
    print(" 2. Run: cd apps/web && npm run dev")
    print(" 3. Visit: http://localhost:3000\n")

if __name__ == "__main__":
    asyncio.run(main())
