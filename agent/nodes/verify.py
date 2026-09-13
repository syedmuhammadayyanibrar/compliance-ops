from typing import Dict, Any, List
from agent.graph.state import ComplianceState
from integrations.gateway import default_gateway

async def execution_and_verification_node(state: ComplianceState) -> Dict[str, Any]:
    """
    Executes approved remediation tasks through the Integration Gateway,
    stores external IDs, and independently verifies their existence in Linear.
    """
    tasks = state.get("remediation_tasks", [])
    approvals = state.get("approvals", [])
    approved_task_ids = {a.get("task_id") for a in approvals if a.get("status") == "approved"}

    updated_tasks: List[Dict[str, Any]] = []
    tool_events: List[Dict[str, Any]] = []
    verification_results: List[Dict[str, Any]] = list(state.get("verification_results", []))

    for task in tasks:
        task_id = task["id"]
        # Only execute if approved by human
        if task_id in approved_task_ids:
            # 1. Execute task creation in Linear
            exec_res = await default_gateway.execute_tool(
                "linear.create_issue",
                title=task.get("title", ""),
                description=task.get("description", ""),
                priority=task.get("priority", "HIGH")
            )
            tool_events.append({
                "step": "execute_remediation",
                "agent": "ActionExecutor",
                "tool": "linear.create_issue",
                "input": {"task_id": task_id, "title": task.get("title")},
                "output": exec_res.get("output"),
                "status": exec_res.get("status"),
                "latency": exec_res.get("latency", 0.1),
                "verified": exec_res.get("status") == "success"
            })

            external_id = None
            if exec_res.get("status") == "success" and exec_res.get("output"):
                external_id = exec_res["output"].get("issue_id")
                task["external_id"] = external_id
                task["external_url"] = exec_res["output"].get("url")
                task["status"] = "created"

                # 2. Independent Verification Node check
                verify_res = await default_gateway.execute_tool(
                    "linear.verify_issue",
                    issue_id=external_id
                )
                is_verified = verify_res.get("output", {}).get("verified", False)
                task["status"] = "verified" if is_verified else "verification_failed"

                verification_entry = {
                    "task_id": task_id,
                    "external_id": external_id,
                    "external_system": "linear",
                    "verified": is_verified,
                    "latency": verify_res.get("latency", 0.05)
                }
                verification_results.append(verification_entry)

                tool_events.append({
                    "step": "verify",
                    "agent": "VerificationNode",
                    "tool": "linear.verify_issue",
                    "input": {"issue_id": external_id},
                    "output": verify_res.get("output"),
                    "status": "success" if is_verified else "failed",
                    "latency": verify_res.get("latency", 0.05),
                    "verified": is_verified
                })
        
        updated_tasks.append(task)

    all_tool_results = state.get("tool_results", []) + tool_events

    return {
        "remediation_tasks": updated_tasks,
        "verification_results": verification_results,
        "tool_results": all_tool_results,
        "pending_approval": None
    }
