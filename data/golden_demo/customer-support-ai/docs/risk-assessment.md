# Risk Management & Assessment Framework

## Framework Reference
EU AI Act Article 9 - Risk Management System

## Scope of Risk Assessment
This document establishes the risk management process for CS-AI-Core across its lifecycle, identifying known and foreseeable risks when used in production customer service environments.

## Identified Risks & Mitigations

### 1. Hallucinated Policy Statements
- **Risk Description**: The AI may fabricate refund limits or warranty extensions not in official store policies.
- **Severity**: High
- **Mitigation**: Grounding enforcement with strict RAG vector embeddings and citation verification before response emission.

### 2. Bias and Toxic Sentiment Output
- **Risk Description**: Disparate treatment or offensive language toward frustrated customers.
- **Severity**: Medium
- **Mitigation**: Pre-output moderation classifier rejecting toxic scores > 0.15.

### 3. Data Leakage / PII Inversion
- **Risk Description**: Customer exposing credit card numbers or government IDs in message stream.
- **Severity**: Critical
- **Mitigation**: Real-time regex and NER sanitizer masking sensitive tokens prior to LLM context ingestion.

## Continuous Risk Review
Periodic reassessment scheduled bi-annually by the AI Safety Board.
