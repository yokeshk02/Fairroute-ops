# FairRoute Ops

FairRoute is a fairness-aware rider assignment engine for e-commerce courier operations. The project is delivered as a polished React + TypeScript WebDev application with a deterministic client-side engine for instant demos, plus an optional FastAPI adapter and portable Python engine reference for container or batch usage.

## What is included

- Operations dashboard with orders, riders, live KPI cards, workload distribution, exceptions, and an explainable plan.
- Working baseline assignment algorithm that selects the lowest estimated delivery time.
- Working fairness-aware algorithm with configurable time, cost, emissions, reliability, workload, and earnings signals.
- Hard constraint enforcement for availability, capacity, maximum distance, package weight, destination restrictions, and deadline risk.
- Comparison screen for speed versus fairness with variance, range, Gini, earnings gap, cost, CO₂, and on-time metrics.
- Normal day, capacity loss, route delay, and urgent-demand disruption simulations.
- Assignment explainability view with decision trail, constraint check, and score breakdown.
- Evaluation page with target-versus-actual guardrails, error analysis, stakeholder validation notes, risk register, and assumptions.
- JSON import and export for demo data; one-click realistic data generation.
- Optional `backend/main.py`, `assignment_engine/engine.py`, and `tests/test_engine.py` for a FastAPI/container workflow.

## Start the WebDev application

```bash
pnpm install
pnpm dev
```

The WebDev runtime serves the app on port 3000. Use the preview URL from the session. The first load opens the dashboard with 28 generated orders and 7 riders.

## Run checks

```bash
pnpm check
pnpm build
```

The Python reference layer can be tested with:

```bash
python -m pytest tests
```

## Product flow

1. Open **Overview** to see operational KPIs and the active fairness-aware plan.
2. Use **Orders** to search the queue, filter priority, import JSON, or generate a new synthetic day.
3. Use **Riders** to inspect capacity, recent workload, reliability, earnings, and toggle availability.
4. Use **Assignment engine** to rerun baseline or fairness-aware assignment and tune weights.
5. Use **Baseline vs fair** to inspect trade-offs and workload shifts.
6. Use **Simulations** to test capacity loss, route delay, and urgent demand.
7. Use **Explainability** to inspect why an order was assigned to a specific rider.
8. Use **Evaluation & risks** to review measured targets, error analysis, validation notes, assumptions, and risks.

## Design direction

The interface uses an editorial operations-console style: warm off-white surfaces, deep forest typography, a restrained teal primary, and distinct amber/coral signals for exceptions. Display type uses DM Serif Display while data and controls use DM Sans. The layout is desktop-first but collapses to a mobile drawer navigation and stacked cards below 760px.

## Important scope note

The preview is intentionally zero-setup: the assignment engine runs in the browser so the demonstration remains functional without needing a separate API process. The FastAPI adapter is included as a handoff seam for teams that want to move calculations server-side and add SQLite/PostgreSQL persistence in a subsequent iteration.
