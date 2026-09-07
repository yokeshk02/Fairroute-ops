# QA Notes

Visual QA completed against the managed preview after the first production build. Desktop screenshots were captured for `/`, `/comparison`, `/simulation`, and `/evaluation` at the default 1280 × 720 viewport.

Findings: the persistent sidebar remains aligned across routes; the warm neutral, forest-teal visual system is consistent; primary/secondary action hierarchy reads clearly; comparison and simulation content fits the viewport without clipping; risk, validation, and target panels use the same spacing and typography; the dashboard hero, KPI cards, workload bars, and alert states render with expected contrast. TypeScript check and production build both pass. Portable Python reference engine tests pass 4/4.

Responsive QA: mobile screenshots were captured for `/` and `/assignment` at 375 × 812. The sidebar collapses behind the hamburger, the top bar remains usable, action buttons wrap without clipping, KPI cards form a two-column grid, and the assignment engine stacks its explanation and weights panels cleanly.

Interaction smoke test: browser navigation reached `/assignment` from the sidebar, and clicking **Run baseline** displayed the success toast `Baseline assignment completed · 28 orders assigned · 100% on-time` while keeping the assignment table rendered.
