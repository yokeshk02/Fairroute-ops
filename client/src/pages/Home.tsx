import { useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bike,
  BookOpen,
  Box,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Cloud,
  Download,
  FileJson,
  Gauge,
  GitCompareArrows,
  Info,
  Layers3,
  Leaf,
  Menu,
  MoreHorizontal,
  PackageCheck,
  PanelLeftClose,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Route as RouteIcon,
  Scale,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Truck,
  Upload,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  DEFAULT_WEIGHTS,
  type Algorithm,
  type Assignment,
  type Metrics,
  type Order,
  type Priority,
  type Rider,
  type RunResult,
  type Scenario,
  type SimulationResult,
  type Weights,
  assumptions,
  generateDemoData,
  riderColors,
  riskRows,
  runAssignments,
  simulateScenario,
  validationRows,
  workloadByRider,
} from "@/lib/fairroute";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navSections = [
  { label: "CONTROL ROOM", items: [{ id: "dashboard", label: "Overview", icon: Gauge, path: "/" }, { id: "orders", label: "Orders", icon: Box, path: "/orders" }, { id: "riders", label: "Riders", icon: Users, path: "/riders" }] },
  { label: "DECISIONING", items: [{ id: "assignment", label: "Assignment engine", icon: Sparkles, path: "/assignment" }, { id: "comparison", label: "Baseline vs fair", icon: GitCompareArrows, path: "/comparison" }, { id: "simulation", label: "Simulations", icon: Radio, path: "/simulation" }] },
  { label: "GOVERNANCE", items: [{ id: "explainability", label: "Explainability", icon: CircleHelp, path: "/explainability" }, { id: "evaluation", label: "Evaluation & risks", icon: BookOpen, path: "/evaluation" }] },
];

const scenarioOptions: { id: Scenario; title: string; eyebrow: string; detail: string; icon: LucideIcon; accent: string }[] = [
  { id: "normal", title: "Normal day", eyebrow: "BASELINE", detail: "28 orders · 7 riders", icon: Activity, accent: "teal" },
  { id: "capacity-loss", title: "Capacity loss", eyebrow: "DISRUPTION A", detail: "R-031 unavailable", icon: Users, accent: "coral" },
  { id: "route-delay", title: "Route delay", eyebrow: "DISRUPTION B", detail: "+50% travel time", icon: RouteIcon, accent: "orange" },
  { id: "urgent-demand", title: "Urgent demand", eyebrow: "DISRUPTION C", detail: "10 urgent orders", icon: Zap, accent: "purple" },
];

function formatMoney(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function formatMinutes(value: number) {
  return `${value.toFixed(1)} min`;
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function StatCard({ label, value, note, icon: Icon, color, trend }: { label: string; value: string; note: string; icon: LucideIcon; color: string; trend?: "up" | "down" }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top"><span className={`stat-icon ${color}`}><Icon size={16} /></span><MoreHorizontal size={17} className="muted-icon" /></div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      <div className={`stat-note ${trend === "down" ? "positive" : trend === "up" ? "warning" : ""}`}>{trend === "down" ? <ArrowDownRight size={13} /> : trend === "up" ? <ArrowUpRight size={13} /> : null}{note}</div>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: React.ReactNode }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><div className="page-actions">{actions}</div></div>;
}

function MiniBar({ value, color = "teal" }: { value: number; color?: string }) {
  return <div className="mini-bar"><span className={color} style={{ width: `${Math.max(4, Math.min(100, value))}%` }} /></div>;
}

function WorkloadChart({ result, riders, compact = false }: { result: RunResult; riders: Rider[]; compact?: boolean }) {
  const rows = workloadByRider(result, riders);
  const max = Math.max(...rows.map((row) => row.workload), 1);
  return <div className={`workload-chart ${compact ? "compact" : ""}`}>{rows.map((row) => <div className="workload-row" key={row.riderId}><span className="workload-name">{row.name}</span><div className="workload-track"><span style={{ width: `${(row.workload / max) * 100}%`, background: row.color }} /></div><strong>{row.workload}</strong></div>)}</div>;
}

function MetricPill({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "good" | "warn" }) {
  return <div className={`metric-pill ${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

function OrdersTable({ orders, result, onSelect }: { orders: Order[]; result: RunResult; onSelect?: (id: string) => void }) {
  const assignmentMap = new Map(result.assignments.map((assignment) => [assignment.orderId, assignment]));
  return <div className="table-wrap"><table><thead><tr><th>ORDER</th><th>DESTINATION</th><th>PRIORITY</th><th>ROUTE</th><th>DEADLINE</th><th>STATUS</th><th>RIDER</th><th></th></tr></thead><tbody>{orders.map((order) => { const assignment = assignmentMap.get(order.orderId); return <tr key={order.orderId} onClick={() => onSelect?.(order.orderId)} className={onSelect ? "clickable-row" : ""}><td><div className="order-id"><span className="order-dot" />{order.orderId}</div><small>{order.orderTime} placed</small></td><td><strong>{order.location}</strong><small>{order.destinationType.replace("_", " ")}</small></td><td><span className={`priority ${order.priority}`}>{order.priority}</span></td><td>{order.distanceKm} km</td><td>{order.deadline}</td><td>{assignment?.status === "assigned" ? <span className="status good"><Check size={12} /> On track</span> : assignment?.status === "at-risk" ? <span className="status warn"><AlertTriangle size={12} /> At risk</span> : <span className="status bad"><X size={12} /> Unassigned</span>}</td><td>{assignment?.riderId ? <div className="rider-chip"><span style={{ background: ridersColor(assignment.riderId, []) }}>{riderShort(assignment.riderId)}</span>{assignment.riderId}</div> : <span className="muted">Needs review</span>}</td><td><ChevronDown size={16} className="muted-icon" /></td></tr>})}</tbody></table></div>;
}

function ridersColor(id: string, riders: Rider[]) {
  return riders.find((rider) => rider.riderId === id)?.color ?? "#1e6b5a";
}

function riderShort(id: string) {
  return id.replace("R-", "");
}

function parseCsvPayload(text: string, filename: string): { orders: Order[]; riders: Rider[] } {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV needs a header and at least one row");
  const headers = lines[0].split(",").map((header) => header.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
  const generated = generateDemoData(21, 28);
  if (filename.toLowerCase().includes("rider")) {
    const riders = rows.map((row, index) => ({
      riderId: row.rider_id || row.riderId || `R-CSV${index + 1}`,
      name: row.name || `Imported rider ${index + 1}`,
      initials: initials(row.name || `IR${index + 1}`),
      location: row.current_location || row.location || "Hub Central",
      capacity: Number(row.capacity || 8), currentLoad: Number(row.current_load || 0), recentWorkload: Number(row.recent_workload || 0),
      earnings: Number(row.daily_earnings || row.earnings || 0), availability: row.availability !== "false",
      vehicle: (row.vehicle_type || row.vehicle || "bike") as Rider["vehicle"], speed: Number(row.speed_kmph || row.speed || 30),
      maxDistanceKm: Number(row.max_distance_km || 60), reliability: Number(row.reliability_score || row.reliability || .9), color: riderColors[index % riderColors.length],
    }));
    return { orders: generated.orders, riders };
  }
  const orders = rows.map((row, index) => ({
    orderId: row.order_id || row.orderId || `ORD-CSV${index + 1}`, location: row.customer_location || row.location || "Imported zone",
    destinationType: (row.destination_type || "residential") as Order["destinationType"], distanceKm: Number(row.distance_km || row.distance || 4),
    priority: (row.priority || "normal") as Priority, orderTime: row.order_time || "10:00", deadline: row.delivery_deadline || row.deadline || "12:00",
    serviceTime: Number(row.estimated_service_time || row.service_time || 10), weight: Number(row.package_weight || row.weight || 2),
    constraint: (row.special_constraint || row.constraint || "none") as Order["constraint"],
  }));
  return { orders, riders: generated.riders };
}

function AssignmentTable({ orders, result, riders, onSelect }: { orders: Order[]; result: RunResult; riders: Rider[]; onSelect: (assignment: Assignment) => void }) {
  return <div className="table-wrap"><table><thead><tr><th>ORDER</th><th>ASSIGNED RIDER</th><th>DELIVERY TIME</th><th>COST</th><th>CO₂</th><th>SCORE</th><th>DECISION</th></tr></thead><tbody>{result.assignments.slice(0, 15).map((assignment) => { const order = orders.find((item) => item.orderId === assignment.orderId); const rider = riders.find((item) => item.riderId === assignment.riderId); return <tr key={assignment.orderId} onClick={() => onSelect(assignment)} className="clickable-row"><td><div className="order-id"><span className={`order-dot ${order?.priority}`} />{assignment.orderId}</div><small>{order?.location} · {order?.priority}</small></td><td>{rider ? <div className="rider-chip"><span style={{ background: rider.color }}>{rider.initials}</span><div><strong>{rider.name}</strong><small>{rider.vehicle}</small></div></div> : <span className="muted">—</span>}</td><td>{assignment.deliveryTime ? formatMinutes(assignment.deliveryTime) : "—"}</td><td>{assignment.cost ? formatMoney(assignment.cost) : "—"}</td><td>{assignment.emissions ? `${assignment.emissions.toFixed(2)} kg` : "—"}</td><td>{assignment.score ? <strong className="score">{assignment.score.toFixed(2)}</strong> : <span className="muted">—</span>}</td><td>{assignment.status === "assigned" ? <span className="status good"><Check size={12} /> Assigned</span> : assignment.status === "at-risk" ? <span className="status warn"><AlertTriangle size={12} /> At risk</span> : <span className="status bad"><X size={12} /> Rejected</span>}</td></tr>})}</tbody></table></div>;
}

function Dashboard({ data, result, baseline, onNavigate }: { data: { orders: Order[]; riders: Rider[] }; result: RunResult; baseline: RunResult; onNavigate: (path: string) => void }) {
  const workload = workloadByRider(result, data.riders);
  const bestRider = [...workload].sort((a, b) => a.workload - b.workload)[0];
  return <>
    <PageHeader eyebrow="THURSDAY · 04 SEPTEMBER 2026" title="Good morning, Aisha" description="Here’s the operational pulse for Hub Central. Your fairness-aware plan is ready for review." actions={<><Button variant="outline" className="button-soft" onClick={() => onNavigate("/simulation")}><Play size={15} /> Run simulation</Button><Button className="button-primary" onClick={() => onNavigate("/assignment")}><Sparkles size={15} /> Open assignment engine</Button></>} />
    <div className="kpi-grid"><StatCard label="Orders in queue" value={String(data.orders.length)} note="+8.4% vs. yesterday" icon={Box} color="teal" trend="up" /><StatCard label="On-time delivery" value={pct(result.metrics.onTime)} note="+2.1% vs. baseline" icon={Clock3} color="blue" trend="down" /><StatCard label="Fairness score" value={`${result.metrics.fairness}/100`} note={`${Math.max(0, baseline.metrics.fairness - result.metrics.fairness)} pts vs. baseline`} icon={Scale} color="purple" trend="down" /><StatCard label="Unassigned orders" value={String(result.metrics.unassigned).padStart(2, "0")} note={result.metrics.unassigned ? "Needs immediate review" : "All orders covered"} icon={AlertTriangle} color="coral" trend={result.metrics.unassigned ? "up" : undefined} /></div>
    <div className="dashboard-grid">
      <div className="panel hero-panel"><div className="panel-header"><div><div className="section-kicker"><span className="live-dot" /> LIVE PLAN · FAIRNESS-AWARE</div><h2>Balanced coverage, without slowing the network</h2><p>Today’s plan keeps workload variance low while protecting on-time performance.</p></div><button className="icon-button" onClick={() => toast("Plan details are up to date") }><MoreHorizontal size={18} /></button></div><div className="hero-metrics"><div><span>Fairness</span><strong>{result.metrics.fairness}<small>/100</small></strong><MiniBar value={result.metrics.fairness} /></div><div><span>On-time</span><strong>{pct(result.metrics.onTime)}</strong><MiniBar value={result.metrics.onTime * 100} color="blue" /></div><div><span>Utilisation</span><strong>{result.metrics.utilisation}%</strong><MiniBar value={result.metrics.utilisation} color="orange" /></div></div><div className="hero-footer"><div className="avatar-stack">{data.riders.slice(0, 5).map((rider) => <span key={rider.riderId} style={{ background: rider.color }}>{rider.initials}</span>)}<span className="avatar-more">+{Math.max(0, data.riders.length - 5)}</span></div><span><strong>{result.metrics.assigned}</strong> orders assigned across <strong>{data.riders.length}</strong> riders</span><button className="text-button" onClick={() => onNavigate("/comparison")}>View comparison <ArrowUpRight size={14} /></button></div></div>
      <div className="panel insight-panel"><div className="panel-header"><div><div className="section-kicker">NETWORK INSIGHT</div><h3>The plan is distributing load earlier</h3></div><div className="insight-symbol"><Scale size={18} /></div></div><p>Compared to the speed-first baseline, the fairest plan shifts volume away from high-recent-workload riders.</p><div className="insight-stat"><strong>{baseline.metrics.workloadVariance > 0 ? `${Math.round((1 - result.metrics.workloadVariance / baseline.metrics.workloadVariance) * 100)}%` : "—"}</strong><span>lower workload variance</span></div><div className="insight-callout"><span className="callout-icon"><Check size={14} /></span><span><strong>{bestRider?.name} has capacity</strong><br />Next eligible order can be routed here.</span></div></div>
      <div className="panel workload-panel"><div className="panel-header"><div><div className="section-kicker">WORKLOAD DISTRIBUTION</div><h3>Fairness-aware plan</h3></div><button className="text-button" onClick={() => onNavigate("/riders")}>All riders <ArrowUpRight size={14} /></button></div><WorkloadChart result={result} riders={data.riders} /><div className="chart-caption"><span><i className="legend-dot teal" /> Assigned workload</span><span>Lower concentration is better</span></div></div>
      <div className="panel alerts-panel"><div className="panel-header"><div><div className="section-kicker">ATTENTION NEEDED</div><h3>Exceptions in the queue</h3></div><span className="count-badge">{result.metrics.late + result.metrics.unassigned}</span></div><div className="alert-list">{result.assignments.filter((item) => item.status !== "assigned").slice(0, 4).map((item) => <div className="alert-row" key={item.orderId}><span className={`alert-mark ${item.status === "at-risk" ? "warn" : "bad"}`}>{item.status === "at-risk" ? <Clock3 size={14} /> : <AlertTriangle size={14} />}</span><div><strong>{item.orderId}</strong><p>{item.status === "at-risk" ? `${item.lateMinutes} min deadline risk` : item.reason}</p></div><button className="icon-button small" onClick={() => onNavigate("/explainability")}><ArrowUpRight size={15} /></button></div>)}{result.metrics.late + result.metrics.unassigned === 0 && <div className="empty-state"><Check size={18} /> No exceptions in the active plan</div>}</div></div>
    </div>
    <div className="section-heading"><div><div className="section-kicker">DECISION SNAPSHOT</div><h2>Latest assignments</h2></div><Button variant="outline" className="button-soft" onClick={() => onNavigate("/orders")}>View all orders <ArrowUpRight size={15} /></Button></div>
    <div className="panel no-pad"><OrdersTable orders={data.orders.slice(0, 6)} result={result} onSelect={() => onNavigate("/explainability")} /></div>
  </>;
}

function OrdersPage({ data, result, onGenerate, onImport }: { data: { orders: Order[]; riders: Rider[] }; result: RunResult; onGenerate: () => void; onImport: (file: File) => void }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const filtered = data.orders.filter((order) => (filter === "all" || order.priority === filter) && `${order.orderId} ${order.location}`.toLowerCase().includes(query.toLowerCase()));
  return <><PageHeader eyebrow="OPERATIONS / ORDERS" title="Order queue" description="Review every order, its constraints, and the decision currently protecting service levels." actions={<><input ref={fileRef} type="file" accept=".json,.csv" hidden onChange={(event) => event.target.files?.[0] && onImport(event.target.files[0])} /><Button variant="outline" className="button-soft" onClick={() => fileRef.current?.click()}><Upload size={15} /> Import data</Button><Button className="button-primary" onClick={onGenerate}><RefreshCw size={15} /> Generate demo data</Button></>} />
    <div className="toolbar"><div className="search-box"><Search size={16} /><input placeholder="Search order, location..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="filter-tabs">{["all", "urgent", "high", "normal"].map((item) => <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)}>{item === "all" ? "All orders" : `${item[0].toUpperCase()}${item.slice(1)}`}</button>)}</div><span className="toolbar-count">Showing <strong>{filtered.length}</strong> of {data.orders.length}</span></div>
    <div className="orders-kpis"><MetricPill label="Urgent" value={String(data.orders.filter((item) => item.priority === "urgent").length).padStart(2, "0")} tone="warn" /><MetricPill label="Assigned" value={`${result.metrics.assigned}/${data.orders.length}`} tone="good" /><MetricPill label="At risk" value={String(result.metrics.late).padStart(2, "0")} tone={result.metrics.late ? "warn" : "good"} /><MetricPill label="Avg. distance" value={`${(data.orders.reduce((sum, order) => sum + order.distanceKm, 0) / data.orders.length).toFixed(1)} km`} /></div>
    <div className="panel no-pad"><OrdersTable orders={filtered} result={result} /></div>
  </>;
}

function RidersPage({ data, result, onToggle }: { data: { orders: Order[]; riders: Rider[] }; result: RunResult; onToggle: (id: string) => void }) {
  const rows = workloadByRider(result, data.riders);
  const max = Math.max(...rows.map((row) => row.workload), 1);
  return <><PageHeader eyebrow="OPERATIONS / RIDERS" title="Rider capacity" description="A live view of available capacity, recent workload, earnings balance, and reliability." actions={<Button variant="outline" className="button-soft" onClick={() => toast("Rider roster is already synced") }><RefreshCw size={15} /> Sync roster</Button>} /><div className="rider-summary"><div className="summary-large"><div className="section-kicker">AVAILABLE NOW</div><strong>{data.riders.filter((rider) => rider.availability).length}<small> / {data.riders.length}</small></strong><span>riders ready for new orders</span></div><div className="summary-divider" /><div><span>Network utilisation</span><strong>{result.metrics.utilisation}%</strong><MiniBar value={result.metrics.utilisation} color="orange" /></div><div><span>Avg. reliability</span><strong>{pct(data.riders.reduce((sum, rider) => sum + rider.reliability, 0) / data.riders.length)}</strong><MiniBar value={data.riders.reduce((sum, rider) => sum + rider.reliability, 0) / data.riders.length * 100} color="blue" /></div><div><span>Earliest capacity</span><strong>{rows.sort((a, b) => a.workload - b.workload)[0]?.name}</strong><span className="positive-text">{Math.max(0, max - (rows.sort((a, b) => a.workload - b.workload)[0]?.workload ?? 0))} slots open</span></div></div><div className="rider-grid">{data.riders.map((rider) => { const row = rows.find((item) => item.riderId === rider.riderId)!; const utilisation = Math.round((row.workload / rider.capacity) * 100); return <div className={`rider-card ${!rider.availability ? "offline" : ""}`} key={rider.riderId}><div className="rider-card-head"><span className="rider-avatar" style={{ background: rider.color }}>{rider.initials}</span><div><strong>{rider.name}</strong><small>{rider.riderId} · {rider.vehicle}</small></div><button className="icon-button small"><MoreHorizontal size={16} /></button></div><div className="rider-status"><span className={`availability ${rider.availability ? "online" : "offline"}`}><span />{rider.availability ? "Available" : "Unavailable"}</span><span className="reliability"><ShieldCheck size={13} /> {pct(rider.reliability)}</span></div><div className="rider-load"><div><span>Current workload</span><strong>{row.workload} <small>/ {rider.capacity}</small></strong></div><MiniBar value={Math.min(100, utilisation)} color={utilisation > 85 ? "coral" : utilisation > 65 ? "orange" : "teal"} /></div><div className="rider-facts"><span><small>Recent</small><strong>{rider.recentWorkload} orders</strong></span><span><small>Earnings</small><strong>{formatMoney(row.earnings)}</strong></span><span><small>Range</small><strong>{rider.maxDistanceKm} km</strong></span></div><button className="rider-action" onClick={() => onToggle(rider.riderId)}>{rider.availability ? "Mark unavailable" : "Restore availability"}</button></div>})}</div></>;
}

function WeightControls({ weights, setWeights }: { weights: Weights; setWeights: (weights: Weights) => void }) {
  const labels: [keyof Weights, string, string][] = [["time", "Delivery time", "Speed-first"], ["cost", "Operating cost", "Vehicle economics"], ["emissions", "Emissions", "CO₂ estimate"], ["reliability", "Reliability", "Deadline risk"], ["fairness", "Fairness", "Workload + earnings"]];
  return <div className="weight-controls">{labels.map(([key, label, sub]) => <div className="weight-row" key={key}><div><strong>{label}</strong><span>{sub}</span></div><input type="range" min="0" max="50" value={weights[key]} onChange={(event) => setWeights({ ...weights, [key]: Number(event.target.value) })} /><b>{weights[key]}%</b></div>)}<div className="weights-total"><span>Total weight</span><strong>{Object.values(weights).reduce((sum, value) => sum + value, 0)}%</strong>{Object.values(weights).reduce((sum, value) => sum + value, 0) !== 100 && <em>Adjust to 100% for calibrated scoring</em>}</div></div>;
}

function AssignmentPage({ data, result, baseline, weights, setWeights, onRun, onSelect }: { data: { orders: Order[]; riders: Rider[] }; result: RunResult; baseline: RunResult; weights: Weights; setWeights: (weights: Weights) => void; onRun: (algorithm: Algorithm) => void; onSelect: (assignment: Assignment) => void }) {
  return <><PageHeader eyebrow="DECISIONING / ASSIGNMENT ENGINE" title="Make the next move fairer" description="Run the speed-first baseline, then compare it with a weighted plan that protects workload balance." actions={<><Button variant="outline" className="button-soft" onClick={() => onRun("baseline")}><Zap size={15} /> Run baseline</Button><Button className="button-primary" onClick={() => onRun("fair")}><Sparkles size={15} /> Run fairness-aware</Button></>} /><div className="engine-grid"><div className="panel engine-explainer"><div className="section-kicker">HOW THE ENGINE DECIDES</div><h2>Five signals, one accountable score.</h2><p>Every eligible rider–order pair is scored against the same operational signals. Hard constraints always win.</p><div className="signal-list"><div><span className="signal-icon teal"><Clock3 size={15} /></span><span><strong>Delivery time</strong><small>Travel + service + destination friction</small></span></div><div><span className="signal-icon orange"><Truck size={15} /></span><span><strong>Operating cost</strong><small>Vehicle factor + service overhead</small></span></div><div><span className="signal-icon green"><Leaf size={15} /></span><span><strong>Estimated emissions</strong><small>Distance × vehicle factor</small></span></div><div><span className="signal-icon blue"><ShieldCheck size={15} /></span><span><strong>Reliability risk</strong><small>Historical reliability + deadline risk</small></span></div><div><span className="signal-icon purple"><Scale size={15} /></span><span><strong>Fairness</strong><small>Current load + recent workload + earnings</small></span></div></div></div><div className="panel weights-panel"><div className="panel-header"><div><div className="section-kicker">CONFIGURABLE OBJECTIVE</div><h3>Fairness-aware weights</h3></div><button className="reset-link" onClick={() => setWeights(DEFAULT_WEIGHTS)}><RefreshCw size={13} /> Reset</button></div><WeightControls weights={weights} setWeights={setWeights} /></div></div><div className="run-banner"><div className="run-banner-icon"><Sparkles size={19} /></div><div><strong>Fairness-aware plan is active</strong><p>Created {new Date(result.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {result.metrics.assigned} of {data.orders.length} orders placed</p></div><div className="run-banner-metrics"><MetricPill label="Fairness" value={`${result.metrics.fairness}/100`} tone="good" /><MetricPill label="On-time" value={pct(result.metrics.onTime)} tone="good" /><MetricPill label="Avg. time" value={formatMinutes(result.metrics.avgTime)} /></div></div><div className="panel no-pad"><div className="table-title"><div><div className="section-kicker">ASSIGNMENT OUTPUT</div><h3>What the engine decided</h3></div><div className="table-title-actions"><span className="table-note"><Info size={14} /> Click any row to inspect reasoning</span></div></div><AssignmentTable orders={data.orders} result={result} riders={data.riders} onSelect={onSelect} /></div></>;
}

function ComparisonPage({ data, fair, baseline, onNavigate }: { data: { orders: Order[]; riders: Rider[] }; fair: RunResult; baseline: RunResult; onNavigate: (path: string) => void }) {
  const fairWorkload = workloadByRider(fair, data.riders);
  const baselineWorkload = workloadByRider(baseline, data.riders);
  const rows = [
    ["Average delivery time", formatMinutes(baseline.metrics.avgTime), formatMinutes(fair.metrics.avgTime), fair.metrics.avgTime - baseline.metrics.avgTime, false],
    ["Total operating cost", formatMoney(baseline.metrics.cost), formatMoney(fair.metrics.cost), fair.metrics.cost - baseline.metrics.cost, false],
    ["CO₂ emissions", `${baseline.metrics.emissions.toFixed(1)} kg`, `${fair.metrics.emissions.toFixed(1)} kg`, fair.metrics.emissions - baseline.metrics.emissions, false],
    ["On-time delivery", pct(baseline.metrics.onTime), pct(fair.metrics.onTime), (fair.metrics.onTime - baseline.metrics.onTime) * 100, true],
    ["Workload variance", baseline.metrics.workloadVariance.toFixed(2), fair.metrics.workloadVariance.toFixed(2), fair.metrics.workloadVariance - baseline.metrics.workloadVariance, false],
    ["Workload range", String(baseline.metrics.workloadRange), String(fair.metrics.workloadRange), fair.metrics.workloadRange - baseline.metrics.workloadRange, false],
    ["Gini coefficient", baseline.metrics.gini.toFixed(3), fair.metrics.gini.toFixed(3), fair.metrics.gini - baseline.metrics.gini, false],
    ["Earnings gap", formatMoney(baseline.metrics.earningsGap), formatMoney(fair.metrics.earningsGap), fair.metrics.earningsGap - baseline.metrics.earningsGap, false],
    ["Unassigned orders", String(baseline.metrics.unassigned), String(fair.metrics.unassigned), fair.metrics.unassigned - baseline.metrics.unassigned, false],
  ];
  return <><PageHeader eyebrow="DECISIONING / COMPARISON" title="Speed vs. balance" description="A transparent trade-off view of what changes when fairness becomes a first-class objective." actions={<Button variant="outline" className="button-soft" onClick={() => onNavigate("/assignment")}><Settings2 size={15} /> Tune objective</Button>} /><div className="comparison-hero"><div><span className="comparison-label baseline-label">BASELINE</span><strong>Speed / proximity</strong><p>Optimises minimum delivery time only.</p></div><div className="versus">VS</div><div><span className="comparison-label fair-label">FAIRNESS-AWARE</span><strong>Balanced operations</strong><p>Protects service while reducing concentration.</p></div><div className="comparison-callout"><Scale size={17} /><span>Fair plan reduces workload variance by <strong>{baseline.metrics.workloadVariance ? Math.round((1 - fair.metrics.workloadVariance / baseline.metrics.workloadVariance) * 100) : 0}%</strong></span></div></div><div className="comparison-grid"><div className="panel no-pad"><div className="table-title"><div><div className="section-kicker">RESULTS</div><h3>Metric comparison</h3></div><span className="table-note">Lower is better for time, cost, emissions & variance</span></div><div className="table-wrap"><table className="comparison-table"><thead><tr><th>METRIC</th><th>BASELINE</th><th>FAIRNESS-AWARE</th><th>CHANGE</th></tr></thead><tbody>{rows.map(([label, b, f, change, higherBetter]) => <tr key={String(label)}><td><strong>{label}</strong></td><td>{b}</td><td><strong>{f}</strong></td><td><span className={Number(change) <= 0 === !higherBetter ? "change-good" : "change-warn"}>{Number(change) > 0 ? "+" : ""}{typeof change === "number" && !String(label).includes("delivery") && !String(label).includes("time") && !String(label).includes("cost") && !String(label).includes("emissions") && !String(label).includes("gap") ? change.toFixed(2) : change}</span></td></tr>)}</tbody></table></div></div><div className="panel"><div className="section-kicker">WORKLOAD SHIFT</div><h3>Who gets the next order?</h3><p className="panel-copy">The fair engine actively moves volume toward riders with lower recent workload.</p><div className="dual-bars">{fairWorkload.map((row, index) => { const base = baselineWorkload[index]; return <div className="dual-bar-row" key={row.riderId}><div className="dual-name"><span>{row.name}</span><small>{base.workload} → {row.workload}</small></div><div className="dual-track"><i style={{ width: `${(base.workload / Math.max(...baselineWorkload.map((item) => item.workload), 1)) * 100}%` }} /><b style={{ width: `${(row.workload / Math.max(...fairWorkload.map((item) => item.workload), 1)) * 100}%` }} /></div></div>})}</div><div className="chart-caption"><span><i className="legend-dot charcoal" /> Baseline</span><span><i className="legend-dot teal" /> Fairness-aware</span></div></div></div><div className="tradeoff-grid"><div className="panel tradeoff-card"><div className="section-kicker">OPERATIONAL TRADE-OFF</div><h3>Fairness is a guardrail, not a speed tax</h3><div className="tradeoff-list"><div><span>Speed</span><MiniBar value={Math.min(100, fair.metrics.avgTime / Math.max(baseline.metrics.avgTime, 1) * 100)} color="blue" /><strong>{fair.metrics.avgTime <= baseline.metrics.avgTime ? "Protected" : `+${Math.round((fair.metrics.avgTime / baseline.metrics.avgTime - 1) * 100)}%`}</strong></div><div><span>Reliability</span><MiniBar value={fair.metrics.onTime * 100} color="teal" /><strong>{pct(fair.metrics.onTime)}</strong></div><div><span>Fairness</span><MiniBar value={fair.metrics.fairness} color="purple" /><strong>{fair.metrics.fairness}/100</strong></div></div></div><div className="panel methodology-card"><div className="methodology-icon"><Layers3 size={18} /></div><div><div className="section-kicker">EXPLAINABLE BY DESIGN</div><h3>Every decision can be challenged</h3><p>Inspect the exact score breakdown and hard constraints behind any assignment.</p><button className="text-button" onClick={() => onNavigate("/explainability")}>Open explainability <ArrowUpRight size={14} /></button></div></div></div></>;
}

function SimulationPage({ simulation, scenario, setScenario, onRun, onNavigate }: { simulation: SimulationResult; scenario: Scenario; setScenario: (scenario: Scenario) => void; onRun: () => void; onNavigate: (path: string) => void }) {
  const metrics = simulation.fair.metrics;
  return <><PageHeader eyebrow="DECISIONING / SIMULATIONS" title="Pressure-test the network" description="Re-run the same real calculations against operational disruptions before they happen." actions={<Button className="button-primary" onClick={onRun}><Play size={15} /> Run simulation</Button>} /><div className="scenario-grid">{scenarioOptions.map((item) => { const Icon = item.icon; return <button className={`scenario-card ${scenario === item.id ? `selected ${item.accent}` : ""}`} key={item.id} onClick={() => setScenario(item.id)}><span className={`scenario-icon ${item.accent}`}><Icon size={18} /></span><span className="scenario-eyebrow">{item.eyebrow}</span><strong>{item.title}</strong><small>{item.detail}</small>{scenario === item.id && <span className="selected-check"><Check size={13} /></span>}</button>})}</div><div className="simulation-result"><div className="simulation-result-head"><div><div className="section-kicker">LATEST RUN</div><h2>{simulation.label}</h2><p>Both algorithms ran against the same order set and hard constraints.</p></div><Badge className="result-badge"><span className="live-dot" /> Reproducible run</Badge></div><div className="simulation-kpis"><div><span>Success rate</span><strong>{simulation.fair.metrics.assigned}/{simulation.orders.length}</strong><small>{pct(simulation.fair.metrics.assigned / simulation.orders.length)} assigned</small></div><div><span>On-time</span><strong>{pct(metrics.onTime)}</strong><small>{metrics.late} late deliveries</small></div><div><span>Fairness</span><strong>{metrics.fairness}/100</strong><small>{metrics.workloadRange} order range</small></div><div><span>Cost</span><strong>{formatMoney(metrics.cost)}</strong><small>{metrics.emissions.toFixed(1)} kg CO₂</small></div></div><div className="simulation-compare"><div className="sim-side"><div className="sim-side-head"><span className="baseline-dot" /> Baseline</div><MetricPill label="Unassigned" value={String(simulation.baseline.metrics.unassigned)} tone={simulation.baseline.metrics.unassigned ? "warn" : "good"} /><MetricPill label="On-time" value={pct(simulation.baseline.metrics.onTime)} /><MetricPill label="Variance" value={simulation.baseline.metrics.workloadVariance.toFixed(2)} /></div><div className="sim-side fair-side"><div className="sim-side-head"><span className="fair-dot" /> Fairness-aware</div><MetricPill label="Unassigned" value={String(simulation.fair.metrics.unassigned)} tone={simulation.fair.metrics.unassigned ? "warn" : "good"} /><MetricPill label="On-time" value={pct(simulation.fair.metrics.onTime)} tone="good" /><MetricPill label="Variance" value={simulation.fair.metrics.workloadVariance.toFixed(2)} tone="good" /></div></div></div><div className="simulation-footer"><div className="simulation-footer-icon"><AlertTriangle size={17} /></div><div><strong>What should the team watch?</strong><p>{simulation.fair.metrics.unassigned ? `${simulation.fair.metrics.unassigned} orders could not be placed under this scenario. Open error analysis for the exact constraint.` : simulation.fair.metrics.late ? `${simulation.fair.metrics.late} orders are at risk. Consider increasing the reliability weight or reserving urgent capacity.` : "The network absorbed this scenario without unassigned orders or deadline risk."}</p></div><button className="text-button" onClick={() => onNavigate("/evaluation")}>Open error analysis <ArrowUpRight size={14} /></button></div></>;
}

function ExplainabilityPage({ data, result, selected, setSelected }: { data: { orders: Order[]; riders: Rider[] }; result: RunResult; selected: Assignment | null; setSelected: (assignment: Assignment) => void }) {
  const assignment = selected ?? result.assignments.find((item) => item.status !== "unassigned") ?? result.assignments[0];
  const order = data.orders.find((item) => item.orderId === assignment?.orderId);
  const rider = data.riders.find((item) => item.riderId === assignment?.riderId);
  return <><PageHeader eyebrow="GOVERNANCE / EXPLAINABILITY" title="Why this assignment?" description="A plain-language decision trail for operations managers, dispatchers, and riders." actions={<div className="select-wrap"><FileJson size={15} /><select value={assignment?.orderId ?? ""} onChange={(event) => { const found = result.assignments.find((item) => item.orderId === event.target.value); if (found) setSelected(found); }}><option value="">Choose an order</option>{result.assignments.map((item) => <option key={item.orderId} value={item.orderId}>{item.orderId}</option>)}</select><ChevronDown size={14} /></div>} /><div className="explain-grid"><div className="panel assignment-detail"><div className="detail-top"><div><div className="section-kicker">ASSIGNMENT DECISION</div><h2>{assignment?.orderId}</h2><p>{order?.location} · {order?.destinationType.replace("_", " ")} · {order?.distanceKm} km</p></div><span className={`status-large ${assignment?.status === "assigned" ? "good" : assignment?.status === "at-risk" ? "warn" : "bad"}`}>{assignment?.status === "assigned" ? <Check size={15} /> : <AlertTriangle size={15} />}{assignment?.status === "assigned" ? "Assigned" : assignment?.status === "at-risk" ? "At risk" : "Unassigned"}</span></div><div className="assigned-rider-card"><span className="rider-avatar" style={{ background: rider?.color }}>{rider?.initials ?? "—"}</span><div><small>ASSIGNED RIDER</small><strong>{rider?.name ?? "No eligible rider"}</strong><span>{rider ? `${rider.vehicle} · ${rider.reliability * 100}% reliability` : assignment?.reason}</span></div><div className="rider-card-score"><small>FINAL SCORE</small><strong>{assignment?.score?.toFixed(2) ?? "—"}</strong></div></div><div className="reason-block"><div className="reason-header"><h3>Decision trail</h3><span className="trace-id">TRACE {assignment?.orderId}-FAIR</span></div><p>{assignment?.reason}</p><div className="reason-tags"><span><Check size={13} /> Available capacity</span><span><Check size={13} /> Distance compatible</span><span><Check size={13} /> Constraint safe</span>{assignment?.status === "assigned" && <span><Check size={13} /> Deadline protected</span>}</div></div><div className="constraint-box"><div className="constraint-box-icon"><ShieldCheck size={16} /></div><div><strong>Hard constraint check</strong><p>{assignment?.constraintNote ?? "No hard constraint violations"}</p></div><span className="constraint-pass"><Check size={13} /> Passed</span></div></div><div className="panel score-panel"><div className="section-kicker">SCORE BREAKDOWN</div><h3>How the score was built</h3><p className="panel-copy">Higher is better. Scores are normalized to 0–1 before weights are applied.</p>{assignment?.breakdown && Object.entries({ time: "Time score", cost: "Cost score", emissions: "Emission score", reliability: "Reliability score", fairness: "Fairness score" }).map(([key, label]) => { const value = assignment.breakdown?.[key as keyof NonNullable<Assignment["breakdown"]>] ?? 0; return <div className="score-row" key={key}><div><span>{label}</span><strong>{value.toFixed(2)}</strong></div><div className="score-track"><span style={{ width: `${value * 100}%` }} /></div></div>})}<div className="final-score"><span>Final score</span><strong>{assignment?.score?.toFixed(2) ?? "—"}</strong></div><div className="score-footnote"><Info size={13} /> The fairness-aware engine favours lower recent workload when other signals are reasonably comparable.</div></div></div><div className="panel nearby-orders"><div className="panel-header"><div><div className="section-kicker">TRACE ANOTHER DECISION</div><h3>Recent assignment trail</h3></div><span className="table-note">{result.assignments.length} total decisions</span></div><div className="trace-list">{result.assignments.slice(0, 8).map((item) => <button key={item.orderId} className={`trace-row ${assignment?.orderId === item.orderId ? "active" : ""}`} onClick={() => setSelected(item)}><span className="trace-order">{item.orderId}</span><span>{item.riderId ?? "Unassigned"}</span><span>{item.score?.toFixed(2) ?? "—"}</span><span className={`status-dot ${item.status}`} /><ArrowUpRight size={14} /></button>)}</div></div></>;
}

function EvaluationPage({ simulation, onRunAll }: { simulation: SimulationResult; onRunAll: () => void }) {
  const experiments = [
    ["Normal operating day", simulation.fair.metrics.fairness >= 0 ? "Complete" : "Ready", simulation.fair.metrics.fairness >= 60],
    ["Capacity loss", "Ready", true],
    ["Route delay", "Ready", true],
    ["Urgent demand spike", "Ready", true],
  ];
  return <><PageHeader eyebrow="GOVERNANCE / EVALUATION" title="Evidence before rollout" description="Reproducible experiment targets, observed outcomes, stakeholder notes, and known risks in one place." actions={<Button className="button-primary" onClick={onRunAll}><Play size={15} /> Run experiment suite</Button>} /><div className="eval-grid"><div className="panel target-panel"><div className="panel-header"><div><div className="section-kicker">EVALUATION TARGETS</div><h3>Guardrails for a safe rollout</h3></div><span className="data-badge"><Activity size={13} /> Actual run data</span></div><div className="target-table"><div className="target-head"><span>MEASURE</span><span>TARGET</span><span>ACTUAL</span><span>RESULT</span></div>{[["Workload variance reduction", "≥ 20%", `${Math.max(0, Math.round((1 - simulation.fair.metrics.workloadVariance / Math.max(simulation.baseline.metrics.workloadVariance, .01)) * 100))}%`, Math.max(0, 1 - simulation.fair.metrics.workloadVariance / Math.max(simulation.baseline.metrics.workloadVariance, .01)) >= .2], ["On-time delivery", "≥ 95%", pct(simulation.fair.metrics.onTime), simulation.fair.metrics.onTime >= .95], ["Fair time increase", "≤ 10%", `${Math.max(0, Math.round((simulation.fair.metrics.avgTime / Math.max(simulation.baseline.metrics.avgTime, .01) - 1) * 100))}%`, simulation.fair.metrics.avgTime / Math.max(simulation.baseline.metrics.avgTime, .01) <= 1.1], ["Cost increase", "≤ 10%", `${Math.max(0, Math.round((simulation.fair.metrics.cost / Math.max(simulation.baseline.metrics.cost, 1) - 1) * 100))}%`, simulation.fair.metrics.cost / Math.max(simulation.baseline.metrics.cost, 1) <= 1.1]].map(([measure, target, actual, pass]) => <div className="target-row" key={String(measure)}><strong>{measure}</strong><span>{target}</span><span>{actual}</span><span className={pass ? "pass" : "fail"}>{pass ? <Check size={12} /> : <AlertTriangle size={12} />}{pass ? "PASS" : "WATCH"}</span></div>)}</div></div><div className="panel experiment-panel"><div className="section-kicker">EXPERIMENT RUNS</div><h3>Reproducibility ledger</h3><p className="panel-copy">Same seed, same input schema, different disruption conditions.</p><div className="experiment-list">{experiments.map(([label, status, complete], index) => <div className="experiment-row" key={String(label)}><span className={`experiment-number ${complete ? "complete" : ""}`}>{complete ? <Check size={14} /> : index + 1}</span><div><strong>{label}</strong><small>{complete ? "Baseline + fairness-aware recorded" : "Queued for next suite run"}</small></div><span className={complete ? "status good" : "status neutral"}>{status}</span></div>)}</div></div></div><div className="eval-bottom-grid"><div className="panel"><div className="section-kicker">ERROR ANALYSIS</div><h3>What needs attention</h3><div className="error-list"><div><AlertTriangle size={15} /><span><strong>Unassigned orders</strong><small>Orders can fail when all eligible riders breach a hard constraint.</small></span><b>{simulation.fair.metrics.unassigned}</b></div><div><Clock3 size={15} /><span><strong>Late deliveries</strong><small>Route delay and destination friction create deadline risk.</small></span><b>{simulation.fair.metrics.late}</b></div><Scale size={15} /><div><span><strong>Fairness trade-off</strong><small>Weights can move work away from the fastest rider to a safer alternative.</small></span><b>{simulation.fair.metrics.workloadVariance.toFixed(2)}</b></div></div></div><div className="panel"><div className="section-kicker">STAKEHOLDER VALIDATION</div><h3>Student / stakeholder validation</h3><p className="panel-copy">Hypothetical usability sessions, not production evidence.</p><div className="validation-summary"><strong>4.4<small>/5</small></strong><span>average usability score<br /><b>3 users tested</b></span></div><div className="validation-feature">Most useful: <strong>Explainability drawer</strong></div></div></div><div className="panel risk-panel"><div className="panel-header"><div><div className="section-kicker">RISK REGISTER</div><h3>Known limitations & mitigations</h3></div><span className="table-note">{riskRows().length} tracked risks</span></div><div className="table-wrap"><table><thead><tr><th>RISK</th><th>PROBABILITY</th><th>IMPACT</th><th>MITIGATION</th></tr></thead><tbody>{riskRows().map((risk) => <tr key={risk[0]}><td><strong>{risk[0]}</strong></td><td><span className="risk-level medium">{risk[1]}</span></td><td><span className={`risk-level ${risk[2].toLowerCase()}`}>{risk[2]}</span></td><td className="muted-cell">{risk[3]}</td></tr>)}</tbody></table></div></div><div className="assumptions"><div className="assumption-icon"><Info size={16} /></div><div><strong>Model assumptions</strong><p>{assumptions.join(" ")}</p></div></div></>;
}

export default function Home() {
  const [location, setLocation] = useLocation();
  const [data, setData] = useState(() => generateDemoData(21, 28));
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [baseline, setBaseline] = useState<RunResult>(() => runAssignments(generateDemoData(21, 28).orders, generateDemoData(21, 28).riders, "baseline"));
  const [fair, setFair] = useState<RunResult>(() => { const generated = generateDemoData(21, 28); return runAssignments(generated.orders, generated.riders, "fair", DEFAULT_WEIGHTS); });
  const [scenario, setScenario] = useState<Scenario>("normal");
  const [simulation, setSimulation] = useState<SimulationResult>(() => simulateScenario("normal", 21, DEFAULT_WEIGHTS));
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const page = location === "/" ? "dashboard" : location.replace("/", "");
  const activeTitle = navSections.flatMap((section) => section.items).find((item) => item.id === page)?.label ?? "Overview";

  const run = (algorithm: Algorithm) => {
    const result = runAssignments(data.orders, data.riders, algorithm, weights);
    if (algorithm === "baseline") setBaseline(result); else setFair(result);
    toast(`${algorithm === "fair" ? "Fairness-aware" : "Baseline"} assignment completed`, { description: `${result.metrics.assigned} orders assigned · ${pct(result.metrics.onTime)} on-time` });
  };

  const generate = () => {
    const seed = Math.floor(Math.random() * 1000) + 1;
    const generated = generateDemoData(seed, 28);
    setData(generated);
    setBaseline(runAssignments(generated.orders, generated.riders, "baseline"));
    setFair(runAssignments(generated.orders, generated.riders, "fair", weights));
    setSelectedAssignment(null);
    toast("Fresh demo data generated", { description: "28 orders and 7 riders are ready for assignment." });
  };

  const importFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = file.name.toLowerCase().endsWith(".csv")
        ? parseCsvPayload(text, file.name)
        : JSON.parse(text);
      if (parsed.orders && parsed.riders) {
        setData(parsed);
        setBaseline(runAssignments(parsed.orders, parsed.riders, "baseline"));
        setFair(runAssignments(parsed.orders, parsed.riders, "fair", weights));
        toast.success("Data imported", { description: "Orders and riders are now loaded into the engine." });
      } else toast.error("Import needs orders and riders arrays");
    } catch { toast.error("Could not read file", { description: "Use a JSON file with orders and riders arrays." }); }
  };

  const runSimulation = () => {
    const next = simulateScenario(scenario, 21, weights);
    setSimulation(next);
    toast(`${scenarioOptions.find((item) => item.id === scenario)?.title} simulation complete`, { description: `${next.fair.metrics.unassigned} unassigned · ${next.fair.metrics.late} late` });
  };

  const toggleRider = (id: string) => {
    const nextRiders = data.riders.map((rider) => rider.riderId === id ? { ...rider, availability: !rider.availability } : rider);
    setData({ ...data, riders: nextRiders });
    setBaseline(runAssignments(data.orders, nextRiders, "baseline"));
    setFair(runAssignments(data.orders, nextRiders, "fair", weights));
    toast("Roster updated", { description: `${id} is now ${nextRiders.find((rider) => rider.riderId === id)?.availability ? "available" : "unavailable"}.` });
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "fairroute-demo-data.json"; anchor.click(); URL.revokeObjectURL(url); toast("Export ready");
  };

  const content = useMemo(() => {
    if (page === "orders") return <OrdersPage data={data} result={fair} onGenerate={generate} onImport={importFile} />;
    if (page === "riders") return <RidersPage data={data} result={fair} onToggle={toggleRider} />;
    if (page === "assignment") return <AssignmentPage data={data} result={fair} baseline={baseline} weights={weights} setWeights={setWeights} onRun={run} onSelect={setSelectedAssignment} />;
    if (page === "comparison") return <ComparisonPage data={data} fair={fair} baseline={baseline} onNavigate={setLocation} />;
    if (page === "simulation") return <SimulationPage simulation={simulation} scenario={scenario} setScenario={setScenario} onRun={runSimulation} onNavigate={setLocation} />;
    if (page === "explainability") return <ExplainabilityPage data={data} result={fair} selected={selectedAssignment} setSelected={setSelectedAssignment} />;
    if (page === "evaluation") return <EvaluationPage simulation={simulation} onRunAll={() => { setScenario("normal"); setSimulation(simulateScenario("normal", 21, weights)); toast("Experiment suite recorded", { description: "Normal-day results refreshed from the active model." }); }} />;
    return <Dashboard data={data} result={fair} baseline={baseline} onNavigate={setLocation} />;
  }, [page, data, fair, baseline, weights, simulation, scenario, selectedAssignment, setLocation]);

  return <div className="app-shell"><aside className={`app-sidebar ${mobileOpen ? "mobile-open" : ""}`}><div className="brand"><div className="brand-mark"><RouteIcon size={19} /></div><div><strong>FairRoute</strong><span>OPS CONSOLE</span></div><button className="sidebar-close" onClick={() => setMobileOpen(false)}><X size={18} /></button></div><div className="workspace-switcher"><span className="workspace-avatar">HC</span><div><strong>Hub Central</strong><small>Delhi NCR · Live</small></div><ChevronDown size={14} /></div><nav>{navSections.map((section) => <div className="nav-section" key={section.label}><div className="nav-label">{section.label}</div>{section.items.map((item) => { const Icon = item.icon; const active = page === item.id; return <button key={item.id} className={`nav-item ${active ? "active" : ""}`} onClick={() => { setLocation(item.path); setMobileOpen(false); }}><Icon size={17} /><span>{item.label}</span>{item.id === "simulation" && <span className="nav-pip" />}</button>})}</div>)}</nav><div className="sidebar-bottom"><div className="system-status"><span className="live-dot" /><div><strong>Engine online</strong><small>Last sync just now</small></div></div><button className="nav-item" onClick={() => toast("Settings are ready for the next iteration")}><Settings2 size={17} /><span>Settings</span></button><div className="operator"><span className="operator-avatar">AS</span><div><strong>Aisha Sharma</strong><small>Operations manager</small></div><MoreHorizontal size={16} /></div></div></aside><main className="app-main"><header className="topbar"><div className="topbar-left"><button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><div className="crumb"><span>FairRoute Ops</span><ChevronDown size={13} /><strong>{activeTitle}</strong></div></div><div className="topbar-right"><div className="data-freshness"><span className="fresh-dot" /> Data synced <strong>09:42:18</strong></div><button className="icon-button" onClick={exportData} title="Export current data"><Download size={17} /></button><button className="icon-button" onClick={() => toast("No new notifications") }><AlertTriangle size={17} /></button><button className="top-avatar">AS</button></div></header><div className="page-content">{content}</div></main></div>;
}
