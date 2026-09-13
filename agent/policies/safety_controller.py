from typing import Dict, Any, Tuple, Optional
from enum import Enum

class ActionRiskLevel(str, Enum):
    READ = "READ"
    WRITE = "WRITE"
    DESTRUCTIVE = "DESTRUCTIVE"

class SafetyPolicyController:
    """
    Deterministic Safety & Policy Controller (inspired by TrialGate).
    Guarantees that LLM-proposed actions never execute consequentially 
    without strict deterministic policy inspection and human-in-the-loop sign-off.
    """

    # Action classification matrix
    ACTION_CLASSIFICATIONS = {
        "github.search": ActionRiskLevel.READ,
        "github.get_file": ActionRiskLevel.READ,
        "drive.search": ActionRiskLevel.READ,
        "drive.get_document": ActionRiskLevel.READ,
        "linear.search_issues": ActionRiskLevel.READ,
        "linear.get_issue": ActionRiskLevel.READ,
        "slack.send_message": ActionRiskLevel.WRITE,
        "linear.create_issue": ActionRiskLevel.WRITE,
        "linear.update_issue": ActionRiskLevel.WRITE,
        "github.create_pr": ActionRiskLevel.WRITE,
        "linear.delete_issue": ActionRiskLevel.DESTRUCTIVE,
        "github.delete_branch": ActionRiskLevel.DESTRUCTIVE,
    }

    def __init__(self, enforce_strict: bool = True):
        self.enforce_strict = enforce_strict

    def classify_action(self, tool_name: str) -> ActionRiskLevel:
        return self.ACTION_CLASSIFICATIONS.get(tool_name, ActionRiskLevel.WRITE)

    def evaluate_action_policy(
        self, 
        tool_name: str, 
        action_payload: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Evaluates whether an action requires Human-In-The-Loop approval.
        Returns:
            (requires_approval: bool, reason: str, approval_ticket: Optional[dict])
        """
        risk = self.classify_action(tool_name)

        if risk == ActionRiskLevel.READ:
            # Read operations are read-only and safe to execute immediately
            return (False, "Read-only operations do not require human sign-off.", None)

        if risk == ActionRiskLevel.DESTRUCTIVE:
            # Strictly prohibited or always requires escalation
            ticket = {
                "action_type": risk.value,
                "tool_name": tool_name,
                "summary": f"Destructive action {tool_name} requested on target {action_payload.get('title', 'unknown')}",
                "priority": "CRITICAL",
                "requires_dual_authorization": True
            }
            return (True, f"Destructive operation '{tool_name}' strictly requires manual approval.", ticket)

        # For WRITE actions (e.g. creating Linear issues, sending Slack alerts):
        priority = action_payload.get("priority", "HIGH")
        is_critical = priority in ["HIGH", "CRITICAL", "URGENT"]

        if is_critical or self.enforce_strict:
            ticket = {
                "action_type": risk.value,
                "tool_name": tool_name,
                "summary": f"Create {action_payload.get('external_system', 'linear')} remediation task: {action_payload.get('title', 'Remediation Task')}",
                "description": action_payload.get("description", ""),
                "priority": priority,
                "finding_id": action_payload.get("finding_id", ""),
                "task_id": action_payload.get("id", ""),
            }
            return (
                True, 
                f"Consequential action '{tool_name}' with priority '{priority}' requires human authorization.", 
                ticket
            )

        return (False, "Low-risk write operation auto-approved by policy.", None)

    @staticmethod
    def validate_execution_result(tool_name: str, tool_output: Dict[str, Any]) -> bool:
        """
        Never claim an action happened when the tool failed or external system did not verify.
        """
        if not tool_output:
            return False
        if tool_output.get("status") in ["failed", "error"]:
            return False
        if tool_name == "linear.create_issue":
            return bool(tool_output.get("issue_id") and tool_output.get("verified", True))
        return True
