# Post-Deployment Monitoring Specification

## Framework Reference
EU AI Act Article 62 & Article 72 - Post-market Monitoring

## Monitoring Scope
The AI engineering team collects telemetry on the deployed CS-AI-Core models in production.

## Telemetry Captured
- Request latency (p50, p95, p99)
- Token throughput and token count per ticket
- Error rates (HTTP 5xx, timeouts)
- User acceptance rate of suggested drafts

## Status & Known Gaps (Draft in progress)
- **Telemetry Infrastructure**: Configured via Prometheus and Grafana dashboards.
- **Monitoring Ownership**: [TBD - Not yet formally assigned to specific operational team or designated compliance officer]
- **Alert Thresholds**: [Under Review - Exact error rate and hallucination thresholds triggering automated alerts have not been specified]
- **Escalation Process**: [Pending Review - No formal SOP defined for escalating post-deployment drift or safety anomalies to the supervisory committee]
