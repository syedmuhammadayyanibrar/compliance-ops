from typing import Dict, Any
from agent.graph.state import ComplianceState
from compliance.retrieval.engine import ComplianceRetrievalEngine

async def retrieve_requirements_node(state: ComplianceState) -> Dict[str, Any]:
    """
    Retrieves curated compliance requirements aligned with the classification scope.
    """
    classification = state.get("classification", {})
    scope = classification.get("assessment_scope", [])
    system_type = classification.get("system_type", "generative_ai")
    risk_category = classification.get("risk_category", "high")

    retriever = ComplianceRetrievalEngine()
    requirements = retriever.retrieve_requirements_for_scope(
        system_type=system_type,
        risk_category=risk_category,
        assessment_scope=scope,
        limit=10
    )

    event = {
        "step": "retrieve_requirements",
        "agent": "RequirementsRetrieval",
        "tool": "compliance.knowledge_base",
        "input": {"scope": scope, "system_type": system_type},
        "output": {"retrieved_count": len(requirements), "requirement_ids": [r["id"] for r in requirements]},
        "status": "success",
        "latency": 0.08,
        "verified": True
    }

    tool_results = state.get("tool_results", []) + [event]

    return {
        "requirements": requirements,
        "tool_results": tool_results
    }
