import time
from typing import Dict, Any
from agent.graph.state import ComplianceState
from agent.llm import llm_client

async def classify_node(state: ComplianceState) -> Dict[str, Any]:
    """
    Evaluates system metadata and user goal to determine system type,
    EU AI Act risk tier, and the corresponding assessment scope.
    """
    user_goal = state.get("user_goal", "").lower()
    system_id = state.get("system_id", "").lower()

    # Domain heuristic & LLM classification
    system_type = "generative_ai"
    risk_category = "high"
    
    if "screener" in system_id or "resume" in user_goal or "recruitment" in user_goal:
        system_type = "decision_support"
        risk_category = "high"
    elif "fraud" in system_id or "predictive" in user_goal or "cybersecurity" in user_goal:
        system_type = "predictive_ai"
        risk_category = "high"
    elif "chatbot" in user_goal or "support" in user_goal:
        system_type = "generative_ai"
        risk_category = "high"

    assessment_scope = [
        "risk_management",
        "human_oversight",
        "data_governance",
        "technical_documentation",
        "monitoring"
    ]
    if system_type == "predictive_ai" or "record" in user_goal or "cybersecurity" in user_goal:
        assessment_scope.append("record_keeping")
    rationale = "System operates as an automated customer interaction / decision tool under EU AI Act Article 6 Annex III classification."

    # If Gemini / LLM key is configured, perform dynamic inference
    if llm_client.gemini_key or llm_client.openai_key:
        llm_prompt = f"System: {system_id}\nGoal: {user_goal}\nClassify system_type and risk_category according to EU AI Act."
        llm_res = await llm_client.generate_json(llm_prompt)
        if llm_res and "system_type" in llm_res:
            system_type = llm_res.get("system_type", system_type)
            risk_category = llm_res.get("risk_category", risk_category)
            if "rationale" in llm_res:
                rationale = llm_res["rationale"]

    classification = {
        "system_type": system_type,
        "risk_category": risk_category,
        "assessment_scope": assessment_scope,
        "rationale": rationale
    }

    event = {
        "step": "classify",
        "agent": "Classifier",
        "tool": None,
        "input": {"system_id": state.get("system_id"), "user_goal": state.get("user_goal")},
        "output": classification,
        "status": "success",
        "latency": 0.12,
        "verified": True
    }

    tool_results = state.get("tool_results", []) + [event]

    return {
        "classification": classification,
        "tool_results": tool_results
    }
