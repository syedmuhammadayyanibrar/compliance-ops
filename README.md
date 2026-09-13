# ComplianceOps: Evidence-Driven Agentic AI Compliance Auditor

> **Evidence-driven agentic compliance auditing system for AI systems.**
> Autonomous EU AI Act & enterprise governance investigation across GitHub repositories, Google Drive policies, Slack HITL approvals, and Linear ticketing.

---

## 1. System Architecture

ComplianceOps uses a unified, stateful **LangGraph** orchestrator with specialized reasoning nodes, a deterministic **Safety / Policy Controller** with dual-key human authorization, and an **Integration Gateway** isolating external tools behind a unified interface:

```
                  ┌───────────────────────────────┐
                  │       Next.js Dashboard       │
                  │  Dashboard • Timeline • Evals │
                  └───────────────┬───────────────┘
                                  │ REST / SSE
                                  ▼
                  ┌───────────────────────────────┐
                  │       FastAPI + Pydantic      │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │     LangGraph Orchestrator    │
                  │ Classify → Plan → Requirements│
                  │ → Evidence → Analyze → Gaps   │
                  │ → Remediation → Policy Gate   │
                  │ → Human Approval → Linear Task│
                  │ → Verify → Audit Report       │
                  └───────┬───────────────┬───────┘
                          │               │
            ┌─────────────┴─────┐   ┌─────┴───────────────────────┐
            │ PostgreSQL+pgvector│   │     Integration Gateway     │
            │  (SQLite Fallback)│   │ GitHub • Drive • Slack • Lin│
            └───────────────────┘   └─────────────────────────────┘
```

---

## 2. Core Features & Compliance Lifecycle

1. **Classifier**: Identifies system type (`generative_ai`, `predictive_ai`, etc.) and determines EU AI Act risk tier (e.g. High Risk under Article 6 Annex III) and assessment scope.
2. **Planner**: Transforms the compliance goal into a concrete investigation plan mapping requirements to required evidence artifacts.
3. **Curated Knowledge Base**: Pre-loaded EU AI Act articles (Article 9 Risk Management, Article 10 Data Governance, Article 11 Technical Documentation, Article 12 Logging, Article 13 Transparency, Article 14 Human Oversight, Article 62 Post-market Monitoring, Article 73 Serious Incident Reporting).
4. **Evidence Agent & Provenance**: Discovers actual code files and governance documents across GitHub and Google Drive. Records exact anchors (`#section:monitoring`), timestamps, and match scores.
5. **Gap Analyzer**: Evaluates requirements against evidence, determining status (`PASS`, `PARTIAL`, `FAIL`, `UNKNOWN`) without hallucinations.
6. **Remediation Agent**: Proposes remediation tasks with priority and assignees. Never executes actions directly.
7. **Safety / Policy Controller (Dual-Key Authorization)**: Consequential external write operations (creating Linear tasks or notifying channels) are strictly gated until authorized by a human reviewer.
8. **Action Executor & Verification Node**: Executes approved Linear issue creation and queries Linear GraphQL API to verify the ticket exists and matches requirements.
9. **Event Replayability**: Persists structured `agent_events` with latencies, tools, inputs, outputs, and verification badges streamed via Server-Sent Events (SSE).
10. **Evaluation Benchmark Suite**: Calculates 8 deterministic reliability and safety metrics across 7 adversarial scenarios.

---

## 3. The 8 Evaluation Metrics

Calculated directly from the evaluation suite (`evals/evaluator.py`):
1. **Safety Policy Gate Compliance**: 100.0% (Zero unapproved write calls)
2. **Task Completion Rate**: 100.0% (7 / 7 scenarios passed)
3. **Finding Accuracy**: 100.0%
4. **Evidence Accuracy**: 99.3% (Grounding in verbatim files)
5. **Recovery Rate**: 100.0% (Safe fallback on simulated tool outages)
6. **Tool Selection Accuracy**: 61.0%
7. **Citation Coverage**: 77.1%
8. **End-to-End Latency**: 0.015s

---

## 4. Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Local Setup
1. **Install Python dependencies**:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Install Frontend dependencies**:
   ```bash
   cd apps/web
   npm install
   cd ../..
   ```

3. **Start the System**:
   Run the all-in-one runner:
   ```bash
   python run_demo.py
   ```
   Or launch FastAPI directly:
   ```bash
   .venv\Scripts\uvicorn services.api.main:app --reload --port 8000
   ```
   And in another terminal:
   ```bash
   cd apps/web
   npm run dev
   ```

4. **Access the Dashboard**:
   Open [http://localhost:3000](http://localhost:3000)

---

## 5. Golden Demo Flow

1. Click **Launch Audit Run** for `Customer Support AI (High Risk)`.
2. Inspect the live **Agent Timeline**:
   - `Classified` -> Generative AI High Risk
   - `Retrieved Requirements` -> Articles 9, 10, 11, 14, 62
   - `Gathered Evidence` -> `README.md`, `model-card.md`, `risk-assessment.md`, `human-oversight.md`, `monitoring.md`, `corporate_ai_governance_charter.md`
   - `Gap Analyzer` -> Catches missing monitoring ownership, alert thresholds, and escalation pathways in `docs/monitoring.md`
   - `Policy Controller` -> Pauses for human approval
3. Open **Approvals** screen, review the proposed Linear task, and click **Approve & Execute Fix**.
4. The Verification Node creates `LIN-1043` in Linear, verifies its existence, and finishes the audit with an updated readiness score of 85.0%.
