import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from integrations.github.client import GitHubClient
from integrations.google_drive.client import GoogleDriveClient
from integrations.slack.client import SlackClient
from integrations.linear.client import LinearClient

class IntegrationGateway:
    """
    Unified, provider-agnostic integration gateway.
    Exposes uniform methods to LangGraph nodes while isolating external protocol changes.
    """

    def __init__(
        self,
        github_client: Optional[GitHubClient] = None,
        drive_client: Optional[GoogleDriveClient] = None,
        slack_client: Optional[SlackClient] = None,
        linear_client: Optional[LinearClient] = None,
    ):
        self.github = github_client or GitHubClient()
        self.drive = drive_client or GoogleDriveClient()
        self.slack = slack_client or SlackClient()
        self.linear = linear_client or LinearClient()

    async def execute_tool(self, tool_name: str, **kwargs) -> Dict[str, Any]:
        """
        Invokes an external tool with latency measurement, error handling, and structured response.
        """
        start_time = time.perf_counter()
        status = "success"
        error_msg = None
        result = None

        try:
            if tool_name == "github.search":
                result = await self.github.search(kwargs.get("query", ""), kwargs.get("repo", "customer-support-ai"))
            elif tool_name == "github.get_file":
                result = await self.github.get_file(kwargs.get("path", ""), kwargs.get("repo", "customer-support-ai"))
            elif tool_name == "drive.search":
                result = await self.drive.search(kwargs.get("query", ""))
            elif tool_name == "drive.get_document":
                result = await self.drive.get_document(kwargs.get("document_id_or_name", ""))
            elif tool_name == "slack.send_message":
                result = await self.slack.send_approval_request(
                    task_id=kwargs.get("task_id", ""),
                    finding_title=kwargs.get("finding_title", ""),
                    action_summary=kwargs.get("action_summary", ""),
                    priority=kwargs.get("priority", "HIGH")
                )
            elif tool_name == "linear.create_issue":
                result = await self.linear.create_issue(
                    title=kwargs.get("title", ""),
                    description=kwargs.get("description", ""),
                    priority=kwargs.get("priority", "HIGH")
                )
            elif tool_name == "linear.verify_issue":
                verified = await self.linear.verify_issue(kwargs.get("issue_id", ""))
                result = {"issue_id": kwargs.get("issue_id"), "verified": verified}
            elif tool_name == "linear.search_issues":
                result = await self.linear.search_issues(kwargs.get("query", ""))
            else:
                raise ValueError(f"Unknown integration tool '{tool_name}'")
        except Exception as e:
            status = "failed"
            error_msg = str(e)
            result = {"error": error_msg}

        elapsed = time.perf_counter() - start_time

        return {
            "tool": tool_name,
            "input": kwargs,
            "output": result,
            "status": status,
            "latency": round(elapsed, 4),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "error": error_msg
        }

# Global singleton gateway
default_gateway = IntegrationGateway()
