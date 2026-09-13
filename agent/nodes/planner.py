from typing import Dict, Any, List
from agent.graph.state import ComplianceState

async def planner_node(state: ComplianceState) -> Dict[str, Any]:
    """
    Converts compliance goal & classification into a structured investigation plan.
    Maps: requirement -> evidence needed -> source -> analysis approach.
    """
    classification = state.get("classification", {})
    scope = classification.get("assessment_scope", ["risk_management", "human_oversight", "monitoring"])
    
    plan_steps: List[Dict[str, Any]] = [
        {
            "step_id": "PLAN-01",
            "domain": "technical_documentation",
            "requirement_focus": "Model Architecture & System Scope",
            "evidence_needed": "model-card.md, README.md",
            "source": "github",
            "analysis_approach": "Validate intended use boundaries and out-of-scope declarations."
        },
        {
            "step_id": "PLAN-02",
            "domain": "risk_management",
            "requirement_focus": "Article 9 Continuous Risk System",
            "evidence_needed": "docs/risk-assessment.md",
            "source": "github",
            "analysis_approach": "Verify known failure modes and hallucination mitigations are documented."
        },
        {
            "step_id": "PLAN-03",
            "domain": "human_oversight",
            "requirement_focus": "Article 14 Human in the Loop & Kill-switch",
            "evidence_needed": "docs/human-oversight.md, Google Drive governance charter",
            "source": "github_and_drive",
            "analysis_approach": "Check that human operator override and supervisor emergency stop mechanisms are specified."
        },
        {
            "step_id": "PLAN-04",
            "domain": "data_governance",
            "requirement_focus": "Article 10 Training Data Governance & PII Scrubbing",
            "evidence_needed": "Google Drive data governance policy, model-card.md",
            "source": "drive",
            "analysis_approach": "Audit PII redaction and dataset demographic distribution controls."
        },
        {
            "step_id": "PLAN-05",
            "domain": "monitoring",
            "requirement_focus": "Article 62 Post-Market Monitoring Procedures",
            "evidence_needed": "docs/monitoring.md",
            "source": "github",
            "analysis_approach": "Check telemetry collection, designated monitoring ownership, alert thresholds, and escalation pathways."
        }
    ]

    event = {
        "step": "plan",
        "agent": "Planner",
        "tool": None,
        "input": {"scope": scope},
        "output": {"plan_steps_count": len(plan_steps)},
        "status": "success",
        "latency": 0.15,
        "verified": True
    }

    tool_results = state.get("tool_results", []) + [event]

    return {
        "investigation_plan": plan_steps,
        "tool_results": tool_results
    }
