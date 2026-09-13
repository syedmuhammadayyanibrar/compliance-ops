# Human Oversight Specification

## Framework Reference
EU AI Act Article 14 - Human Oversight Measures

## Oversight Architecture
The CS-AI-Core operates under a **Human-in-the-Loop (HITL)** architecture for all high-consequence customer responses:

1. **Reviewer Interface**: All AI-generated customer responses are initially presented as drafts to human tier-1/tier-2 customer support agents.
2. **Override and Edit Controls**: Human agents have unilateral authority to edit, approve, or reject draft recommendations.
3. **Emergency Stop (Kill Switch)**: A supervisor dashboard allows instant decoupling of the AI pipeline, routing 100% of customer tickets to human queue in the event of anomalous drift.
4. **Competence & Training**: Operators complete mandatory 4-hour certification on cognitive bias, automation complacency, and escalation triage.
