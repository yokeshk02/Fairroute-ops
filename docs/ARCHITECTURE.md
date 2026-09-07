# FairRoute Architecture

## Runtime view

```text
Browser
  ↓
React + TypeScript + Tailwind UI
  ↓
Deterministic assignment engine (client-side MVP)
  ↓
Metrics + fairness evaluation layer
  ↓
Local state / JSON import-export

Optional production seam:
React UI → FastAPI adapter → assignment_engine → SQLite/PostgreSQL
```

The preview keeps the engine client-side to guarantee a working demo in a managed browser environment. The calculations are pure functions in `client/src/lib/fairroute.ts`, which makes them easy to unit test and move behind the FastAPI adapter later.

## Frontend areas

`Home.tsx` owns the workspace shell and route-level composition. The primary product views are Overview, Orders, Riders, Assignment engine, Baseline vs fair, Simulations, Explainability, and Evaluation & risks. All pages share the same persistent sidebar, context header, interaction vocabulary, and toast feedback.

## Engine layers

The generator creates reproducible synthetic orders and riders from a seed. Constraint checking removes ineligible rider-order pairs before scoring. Estimation converts distance, speed, service time, destination friction, and vehicle factors into delivery time, cost, emissions, and deadline risk. Baseline ranks by delivery time. Fairness-aware scoring blends normalized time, cost, emissions, reliability risk, workload, and earnings imbalance according to UI-configurable weights. Metrics then calculate on-time rate, variance, range, Gini coefficient, earnings gap, utilization, cost, and emissions.

## Future persistence

The optional backend defines an API contract for `/health`, `/assign/{algorithm}`, and `/simulate/disruption`. A production implementation should persist `orders`, `riders`, `assignments`, and `simulation_runs`, keeping timestamps in UTC and replacing synthetic inputs with validated telemetry.
