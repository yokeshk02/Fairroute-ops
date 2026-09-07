# FairRoute Experiment Design

## Reproducible setup

The default demo uses a deterministic generator seed of `21`, 28 orders, and 7 riders. The generator includes varied priorities, destinations, distances, package weights, capacities, recent workloads, earnings, vehicle types, and reliability scores. Changing the seed creates a fresh operating day while keeping every calculation deterministic for that input.

The experiment suite contains four runs: normal operating day, capacity loss with rider `R-031` unavailable, route delay with travel time multiplied by 1.5, and urgent demand with 10 urgent orders and a tighter deadline. Every run executes both the baseline and fairness-aware algorithm against the same orders and rider roster.

## Targets

| Measure | Target | Direction |
|---|---:|---|
| Workload variance reduction | ≥ 20% | Higher reduction is better |
| On-time delivery | ≥ 95% | Higher is better |
| Fairness-aware time increase | ≤ 10% | Lower is better |
| Cost increase | ≤ 10% | Lower is better |
| Emissions increase | ≤ 10% | Lower is better |

The Evaluation & risks screen calculates actuals from the active run. It labels each guardrail PASS or WATCH and does not hard-code an evaluation result.

## Interpretation

The baseline provides a speed-first counterfactual. The fair plan can select a slightly slower rider when the rider has materially lower recent workload or a better earnings balance. The comparison should therefore be read as a service-protection and concentration-reduction trade-off, not as a claim that fairness always improves every operational metric.
