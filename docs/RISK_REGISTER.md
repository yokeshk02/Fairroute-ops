# FairRoute Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Incorrect location estimates | Medium | High | Validate distance inputs against route telemetry before production use. |
| Unrealistic synthetic data | Medium | Medium | Document assumptions and replace with historical samples during pilot. |
| Fairness increases delivery time | Medium | High | Keep time as a guardrail, tune weights, and review the comparison screen. |
| Rider data becomes stale | High | Medium | Refresh workload, availability, earnings, and reliability periodically. |
| Too many urgent orders | Medium | High | Reserve priority capacity and test the urgent-demand simulation. |
| No available rider | Medium | High | Show a safe unassigned state with the violated constraint. |
| Algorithm bias | Medium | High | Monitor workload, earnings, reliability, and assignment parity across runs. |

# Stakeholder validation

The UI includes a clearly labeled student / stakeholder validation summary. It is not real production deployment evidence.

| Role tested | Usability score | Most useful feature | Main concern | Suggested improvement |
|---|---:|---|---|---|
| Operations manager | 4.6 / 5 | Baseline comparison | Bulk reassignment flow | Add shift handoff export |
| Dispatch supervisor | 4.4 / 5 | Explainability drawer | Route-level alerts | Add map overlay and escalation rules |
| Rider | 4.1 / 5 | Workload transparency | Earnings assumptions need context | Show payout policy with balance |
