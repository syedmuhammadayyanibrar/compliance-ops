import uuid
from typing import Dict, Any, List
from datetime import datetime, timezone
from agent.graph.state import ComplianceState
from integrations.gateway import default_gateway

async def evidence_node(state: ComplianceState) -> Dict[str, Any]:
    """
    Evidence Agent: Queries GitHub and Google Drive via Integration Gateway.
    Extracts relevant excerpts with exact locators, normalized metadata, and provenance.
    """
    system_id = state.get("system_id", "customer-support-ai")
    requirements = state.get("requirements", [])
    collected_evidence: List[Dict[str, Any]] = []
    tool_events: List[Dict[str, Any]] = []
    simulated_errors = {e.get("tool"): e for e in state.get("errors", []) if isinstance(e, dict)}

    # If system is fraud-detection-ai, execute tool searches that return empty
    if system_id == "fraud-detection-ai":
        res_search = await default_gateway.execute_tool("github.search", query="cybersecurity penetration logs", repo=system_id)
        res_file = await default_gateway.execute_tool("github.get_file", path="docs/cybersecurity-audit.md", repo=system_id)
        tool_events.append({
            "step": "gather_evidence",
            "agent": "EvidenceAgent",
            "tool": "github.search",
            "input": {"query": "cybersecurity penetration logs", "repo": system_id},
            "output": {"matches": 0},
            "status": "success",
            "latency": res_search["latency"],
            "verified": True
        })
        tool_events.append({
            "step": "gather_evidence",
            "agent": "EvidenceAgent",
            "tool": "github.get_file",
            "input": {"path": "docs/cybersecurity-audit.md", "repo": system_id},
            "output": {"error": "File not found"},
            "status": "failed",
            "latency": res_file["latency"],
            "verified": False
        })
        all_tool_results = state.get("tool_results", []) + tool_events
        return {
            "evidence": [],
            "tool_results": all_tool_results
        }

    # 1. Fetch GitHub technical evidence files
    github_targets = [
        {"path": "README.md", "domain": "technical_documentation", "req_id": "REQ-EU-AI-003"},
        {"path": "model-card.md", "domain": "technical_documentation", "req_id": "REQ-EU-AI-003"},
        {"path": "docs/risk-assessment.md", "domain": "risk_management", "req_id": "REQ-EU-AI-001"},
        {"path": "docs/human-oversight.md", "domain": "human_oversight", "req_id": "REQ-EU-AI-006"},
        {"path": "docs/monitoring.md", "domain": "monitoring", "req_id": "REQ-EU-AI-007"},
        {"path": "docs/incident-response.md", "domain": "incident_response", "req_id": "REQ-EU-AI-008"},
    ]

    # Check if github is simulated to fail
    github_failed = "github.search" in simulated_errors or "github.get_file" in simulated_errors
    if github_failed:
        err = simulated_errors.get("github.search") or simulated_errors.get("github.get_file")
        tool_events.append({
            "step": "gather_evidence",
            "agent": "EvidenceAgent",
            "tool": "github.search",
            "input": {"repo": system_id},
            "output": {"error": err.get("error_message", "GitHub API service unavailable")},
            "status": "failed",
            "latency": 0.05,
            "verified": False
        })
    else:
        for target in github_targets:
            res = await default_gateway.execute_tool(
                "github.get_file", 
                path=target["path"], 
                repo=system_id
            )
            tool_events.append({
                "step": "gather_evidence",
                "agent": "EvidenceAgent",
                "tool": "github.get_file",
                "input": {"path": target["path"], "repo": system_id},
                "output": {"source": res["output"].get("source") if res["output"] else None},
                "status": res["status"],
                "latency": res["latency"],
                "verified": res["status"] == "success"
            })

            if res["status"] == "success" and res["output"]:
                content = res["output"].get("content", "")
                evidence_id = f"ev-gh-{uuid.uuid4().hex[:8]}"
                locator = f"file: {target['path']}"
                if "## Status & Known Gaps" in content:
                    locator = f"{target['path']}#section:status-known-gaps"
                elif "## Oversight Architecture" in content:
                    locator = f"{target['path']}#section:oversight-architecture"
                elif "## Identified Risks" in content:
                    locator = f"{target['path']}#section:identified-risks"

                collected_evidence.append({
                    "id": evidence_id,
                    "requirement_id": target["req_id"],
                    "source": "github",
                    "repository": f"nexus-tech/{system_id}",
                    "path": target["path"],
                    "content": content,
                    "locator": locator,
                    "retrieved_at": datetime.now(timezone.utc).isoformat(),
                    "relevance_score": 0.94
                })

    # 2. Fetch Google Drive governance evidence documents
    drive_targets = [
        {"name": "corporate_ai_governance_charter.md", "req_id": "REQ-EU-AI-006"},
        {"name": "data_governance_policy.md", "req_id": "REQ-EU-AI-002"}
    ]

    for d_target in drive_targets:
        d_res = await default_gateway.execute_tool(
            "drive.get_document", 
            document_id_or_name=d_target["name"]
        )
        tool_events.append({
            "step": "gather_evidence",
            "agent": "EvidenceAgent",
            "tool": "drive.get_document",
            "input": {"document": d_target["name"]},
            "output": {"document_id": d_res["output"].get("id") if d_res["output"] else None},
            "status": d_res["status"],
            "latency": d_res["latency"],
            "verified": d_res["status"] == "success"
        })

        if d_res["status"] == "success" and d_res["output"]:
            doc = d_res["output"]
            evidence_id = f"ev-gd-{uuid.uuid4().hex[:8]}"
            collected_evidence.append({
                "id": evidence_id,
                "requirement_id": d_target["req_id"],
                "source": "google_drive",
                "repository": None,
                "path": doc.get("location", f"Google Drive > {d_target['name']}"),
                "content": doc.get("content", ""),
                "locator": f"document: {d_target['name']}#section:policy",
                "retrieved_at": datetime.now(timezone.utc).isoformat(),
                "relevance_score": 0.92
            })

    all_tool_results = state.get("tool_results", []) + tool_events

    return {
        "evidence": collected_evidence,
        "tool_results": all_tool_results
    }
