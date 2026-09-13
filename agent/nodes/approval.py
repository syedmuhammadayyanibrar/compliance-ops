import uuid
from typing import Dict, Any, List
from agent.graph.state import ComplianceState
from agent.policies.safety_controller import SafetyPolicyController
from integrations.gateway import default_gateway

policy_controller = SafetyPolicyController(enforce_strict=True)

async def policy_and_approval_node(state: ComplianceState) -> Dict[str, Any]:
    """
    Safety / Policy Controller Node:
    Evaluates proposed remediation actions against deterministic policy.
    If human approval is required, dispatches notification to Slack and sets pending_approval.
    """
    tasks = state.get("remediation_tasks", [])
    approvals = state.get("approvals", [])
    resolved_task_ids = {a.get("task_id") for a in approvals if a.get("status") == "approved"}
    rejected_task_ids = {a.get("task_id") for a in approvals if a.get("status") == "rejected"}

    pending_ticket = None
    tool_events: List[Dict[str, Any]] = []

    for task in tasks:
        task_id = task["id"]
        if task_id in resolved_task_ids or task_id in rejected_task_ids:
            continue

        # Evaluate against Policy Controller
        req_approval, reason, ticket = policy_controller.evaluate_action_policy(
            tool_name="linear.create_issue",
            action_payload=task
        )

        if req_approval:
            approval_id = f"appr-{uuid.uuid4().hex[:8]}"
            ticket["id"] = approval_id
            ticket["run_id"] = state.get("run_id")
            ticket["task_id"] = task_id
            ticket["status"] = "pending"
            pending_ticket = ticket

            # Trigger Slack notification
            slack_res = await default_gateway.execute_tool(
                "slack.send_message",
                task_id=task_id,
                finding_title=task.get("title", ""),
                action_summary=ticket.get("summary", ""),
                priority=ticket.get("priority", "HIGH")
            )
            tool_events.append({
                "step": "approval_request",
                "agent": "PolicyController",
                "tool": "slack.send_message",
                "input": {"task_id": task_id},
                "output": slack_res.get("output"),
                "status": "success",
                "latency": slack_res.get("latency", 0.05),
                "verified": True
            })
            break

    tool_events.append({
        "step": "policy_check",
        "agent": "SafetyPolicyController",
        "tool": "policy_engine",
        "input": {"pending_tasks": len(tasks)},
        "output": {"approval_required": pending_ticket is not None, "ticket": pending_ticket},
        "status": "success",
        "latency": 0.05,
        "verified": True
    })

    tool_results = state.get("tool_results", []) + tool_events

    return {
        "pending_approval": pending_ticket,
        "tool_results": tool_results
    }
