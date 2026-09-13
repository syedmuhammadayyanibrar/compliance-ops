from typing import Dict, Any, Literal
from langgraph.graph import StateGraph, END
from agent.graph.state import ComplianceState
from agent.nodes.classifier import classify_node
from agent.nodes.planner import planner_node
from agent.nodes.requirements import retrieve_requirements_node
from agent.nodes.evidence import evidence_node
from agent.nodes.analyzer import analyzer_node
from agent.nodes.remediate import remediate_node
from agent.nodes.approval import policy_and_approval_node
from agent.nodes.verify import execution_and_verification_node
from agent.nodes.report import report_node

def route_after_analysis(state: ComplianceState) -> Literal["remediate", "report"]:
    findings = state.get("findings", [])
    has_gaps = any(f.get("status") in ["PARTIAL", "FAIL", "UNKNOWN"] for f in findings)
    return "remediate" if has_gaps else "report"

def route_after_approval(state: ComplianceState) -> Literal["execute_and_verify", "wait_for_approval"]:
    # If policy controller identified an action requiring human approval
    # and no corresponding approval resolution exists yet:
    pending = state.get("pending_approval")
    if pending and pending.get("status") == "pending":
        return "wait_for_approval"
    return "execute_and_verify"

def wait_node(state: ComplianceState) -> Dict[str, Any]:
    """Node representing workflow pause waiting for human approval."""
    return {"pending_approval": state.get("pending_approval")}

def build_compliance_graph():
    builder = StateGraph(ComplianceState)

    # Register Nodes
    builder.add_node("classify", classify_node)
    builder.add_node("plan", planner_node)
    builder.add_node("retrieve_requirements", retrieve_requirements_node)
    builder.add_node("gather_evidence", evidence_node)
    builder.add_node("analyze", analyzer_node)
    builder.add_node("remediate", remediate_node)
    builder.add_node("policy_and_approval", policy_and_approval_node)
    builder.add_node("wait_for_approval", wait_node)
    builder.add_node("execute_and_verify", execution_and_verification_node)
    builder.add_node("report", report_node)

    # Set Entry Point
    builder.set_entry_point("classify")

    # Linear investigation pipeline
    builder.add_edge("classify", "plan")
    builder.add_edge("plan", "retrieve_requirements")
    builder.add_edge("retrieve_requirements", "gather_evidence")
    builder.add_edge("gather_evidence", "analyze")

    # Conditional Branching after Analysis
    builder.add_conditional_edges(
        "analyze",
        route_after_analysis,
        {
            "remediate": "remediate",
            "report": "report"
        }
    )

    # Remediation -> Policy Gate
    builder.add_edge("remediate", "policy_and_approval")

    # Conditional Branching at Policy Gate
    builder.add_conditional_edges(
        "policy_and_approval",
        route_after_approval,
        {
            "wait_for_approval": "wait_for_approval",
            "execute_and_verify": "execute_and_verify"
        }
    )

    builder.add_edge("wait_for_approval", END)
    builder.add_edge("execute_and_verify", "report")
    builder.add_edge("report", END)

    return builder.compile()

# Workflow orchestrator runner
compliance_workflow = build_compliance_graph()

async def run_audit_workflow(initial_state: ComplianceState) -> ComplianceState:
    """Executes the audit workflow up to completion or awaiting approval."""
    return await compliance_workflow.ainvoke(initial_state)

async def resume_audit_workflow(
    current_state: ComplianceState, 
    approval_decision: Dict[str, Any]
) -> ComplianceState:
    """
    Resumes an audit run after human approval resolution.
    """
    updated_state = dict(current_state)
    approvals = list(updated_state.get("approvals", []))
    approvals.append(approval_decision)
    updated_state["approvals"] = approvals

    if approval_decision.get("status") == "approved":
        # Resume execution -> verification -> report
        exec_state = await execution_and_verification_node(updated_state)
        updated_state.update(exec_state)
        report_state = await report_node(updated_state)
        updated_state.update(report_state)
    else:
        # Rejection: bypass execution directly to report
        updated_state["pending_approval"] = None
        report_state = await report_node(updated_state)
        updated_state.update(report_state)

    return updated_state
