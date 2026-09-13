# Model Card: CS-AI Foundation 7B

## Model Details
- **Developer**: Nexus Technologies AI Engineering Team
- **Model Date**: February 2026
- **Model Type**: Autoregressive Transformer with LoRA fine-tuning for customer dispute mediation
- **Version**: 1.2.0-rc3
- **Base Architecture**: 7 Billion parameters decoder-only model
- **License**: Proprietary Commercial

## Intended Use
- **Primary Use Cases**: Generating contextual draft responses for customer service tickets, summarizing long conversation histories, extracting customer sentiment and dissatisfaction signals.
- **Out of Scope Uses**: Autonomous execution of bank refunds exceeding \$50, credit score profiling, medical or legal counsel.

## Training Data & Data Governance
- Dataset comprises sanitized historical customer support interactions from 2023–2025.
- Personally Identifiable Information (PII) redaction applied using Microsoft Presidio and internal named entity recognition filters.
- Data governance controls documented under EU AI Act Article 10.

## Performance & Limitations
- Accuracy on intent classification benchmark: 94.2%
- Hallucination rate in controlled evaluation: 1.8%
- Limitation: Performance degrades on non-English customer queries; fallback to human agent required.
