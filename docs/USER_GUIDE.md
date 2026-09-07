# FairRoute User Guide

## Daily workflow

Start at Overview. The four KPI cards show queue size, on-time delivery, fairness, and unassigned orders. The live plan card summarizes the currently active fairness-aware run; the workload distribution and exceptions panels show where to look next.

Use Orders to search by order ID or location and filter by priority. Generate demo data for a fresh day or import a JSON file containing `orders` and `riders`. Use Riders to inspect active capacity and toggle availability when simulating a rider outage.

Open Assignment engine to run the baseline or fairness-aware strategy. Use the sliders to adjust weights; reset them to the default 30% time, 15% cost, 10% emissions, 20% reliability, and 25% fairness objective. Click a row in the output to open its decision trail.

Use Baseline vs fair to inspect the operational trade-off. Lower is better for time, cost, emissions, workload variance, range, Gini coefficient, and earnings gap. Higher is better for on-time delivery and fairness score.

Use Simulations to select a normal day, capacity loss, route delay, or urgent demand scenario. Click Run simulation to recalculate both algorithms. The page reports assignment success, on-time rate, fairness, cost, and the most important team watch-out.

Use Explainability to select an order and review the assigned rider, hard-constraint check, natural-language reason, and normalized score breakdown.

## Failure cases

When no rider is eligible, the engine returns `Unassigned` with a reason rather than crashing. When a candidate breaches capacity, distance, package weight, or vehicle compatibility, the candidate is rejected before scoring. If all eligible riders miss a deadline, the order remains assigned but is marked `At risk` with late minutes, making the trade-off visible.

## Export

Use the download icon in the top bar to export the current order and rider data as `fairroute-demo-data.json`. This is suitable for a reproducible handoff or later API import.
