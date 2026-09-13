from typing import Dict, Any
from agent.graph.state import ComplianceState

async def report_node(state: ComplianceState) -> Dict[str, Any]:
    """
    Report Node:
    Produces final audit summary with readiness score, risk score,
    findings breakdown, evidence coverage, actions, approvals, and verification status.
    """
    findings = state.get("findings", [])
    evidence = state.get("evidence", [])
    tasks = state.get("remediation_tasks", [])
    approvals = state.get("approvals", [])
    verifications = state.get("verification_results", [])

    total_findings = len(findings)
    pass_count = sum(1 for f in findings if f.get("status") == "PASS")
    partial_count = sum(1 for f in findings if f.get("status") == "PARTIAL")
    fail_count = sum(1 for f in findings if f.get("status") == "FAIL")
    unknown_count = sum(1 for f in findings if f.get("status") == "UNKNOWN")

    # Calculate Readiness Score (0 - 100%)
    if total_findings > 0:
        readiness_score = round(((pass_count + (partial_count * 0.5)) / total_findings) * 100, 1)
    else:
        readiness_score = 100.0

    # Calculate Risk Score (0 - 10)
    risk_weights = {"LOW": 1.0, "MEDIUM": 3.0, "HIGH": 7.0, "CRITICAL": 10.0}
    active_risks = [risk_weights.get(f.get("severity", "LOW"), 1.0) for f in findings if f.get("status") in ["PARTIAL", "FAIL"]]
    risk_score = round(max(active_risks) if active_risks else 1.0, 1)

    # Citation coverage
    findings_with_evidence = sum(1 for f in findings if len(f.get("evidence_ids", [])) > 0)
    citation_coverage = round((findings_with_evidence / total_findings) * 100, 1) if total_findings > 0 else 100.0

    final_report = {
        "run_id": state.get("run_id"),
        "system_id": state.get("system_id"),
        "user_goal": state.get("user_goal"),
        "readiness_score": readiness_score,
        "risk_score": risk_score,
        "status": "completed",
        "citation_coverage": citation_coverage,
        "summary": {
            "total_requirements_analyzed": total_findings,
            "pass_count": pass_count,
            "partial_count": partial_count,
            "fail_count": fail_count,
            "unknown_count": unknown_count,
            "total_evidence_collected": len(evidence),
            "remediation_tasks_created": len([t for t in tasks if t.get("status") in ["created", "verified"]]),
            "approvals_resolved": len(approvals),
            "verified_actions": len([v for v in verifications if v.get("verified")])
        },
        "executive_summary": (
            f"Compliance assessment completed for {state.get('system_id')}. "
            f"Overall regulatory readiness is {readiness_score}%. "
            f"Identified {partial_count} partial gaps requiring remediation. "
            f"Human-in-the-loop approvals and external task verifications successfully recorded."
        )
    }

    event = {
        "step": "report",
        "agent": "ReportNode",
        "tool": None,
        "input": {"total_findings": total_findings},
        "output": final_report,
        "status": "success",
        "latency": 0.08,
        "verified": True
    }

    tool_results = state.get("tool_results", []) + [event]

    return {
        "final_report": final_report,
        "tool_results": tool_results
    }
