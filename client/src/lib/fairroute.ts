export type Priority = "urgent" | "high" | "normal";
export type Algorithm = "baseline" | "fair";
export type Scenario = "normal" | "capacity-loss" | "route-delay" | "urgent-demand";

export type Order = {
  orderId: string;
  location: string;
  destinationType: "gated_apartment" | "office_complex" | "residential" | "retail";
  distanceKm: number;
  priority: Priority;
  orderTime: string;
  deadline: string;
  serviceTime: number;
  weight: number;
  constraint: "security_gate" | "lift_required" | "fragile" | "none";
};

export type Rider = {
  riderId: string;
  name: string;
  initials: string;
  location: string;
  capacity: number;
  currentLoad: number;
  recentWorkload: number;
  earnings: number;
  availability: boolean;
  vehicle: "bike" | "scooter" | "van";
  speed: number;
  maxDistanceKm: number;
  reliability: number;
  color: string;
};

export type Weights = {
  time: number;
  cost: number;
  emissions: number;
  reliability: number;
  fairness: number;
};

export type Assignment = {
  orderId: string;
  riderId: string | null;
  algorithm: Algorithm;
  status: "assigned" | "unassigned" | "at-risk";
  reason: string;
  deliveryTime: number;
  cost: number;
  emissions: number;
  onTime: boolean;
  lateMinutes: number;
  score: number | null;
  breakdown: {
    time: number;
    cost: number;
    emissions: number;
    reliability: number;
    fairness: number;
  } | null;
  constraintNote?: string;
};

export type RunResult = {
  algorithm: Algorithm;
  assignments: Assignment[];
  metrics: Metrics;
  createdAt: string;
};

export type Metrics = {
  assigned: number;
  unassigned: number;
  avgTime: number;
  maxTime: number;
  late: number;
  onTime: number;
  cost: number;
  emissions: number;
  reliability: number;
  fairness: number;
  workloadVariance: number;
  workloadRange: number;
  gini: number;
  earningsGap: number;
  utilisation: number;
};

export type SimulationResult = {
  scenario: Scenario;
  label: string;
  baseline: RunResult;
  fair: RunResult;
  riders: Rider[];
  orders: Order[];
};

export const DEFAULT_WEIGHTS: Weights = {
  time: 30,
  cost: 15,
  emissions: 10,
  reliability: 20,
  fairness: 25,
};

const locations = ["Gate-A", "Cedar Heights", "Northstar Plaza", "Orbit Mall", "Lakeview Towers", "Civic Square", "Meadow Park", "Harbor Point"];
export const riderColors = ["#1e6b5a", "#e69239", "#4057c8", "#d65946", "#8b5cf6", "#0f8b8d", "#be7c4d"];

function seeded(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => (value = value * 16807 % 2147483647) / 2147483647;
}

function minutesToTime(minutes: number) {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = Math.round(minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function timeToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export function generateDemoData(seed = 21, orderCount = 28) {
  const random = seeded(seed);
  const riders: Rider[] = [
    ["R-014", "Maya Chen", "MC", "Hub East", 8, 2, 9, 586, true, "bike", 31, 58, .96],
    ["R-021", "Arjun Rao", "AR", "Hub Central", 7, 3, 18, 742, true, "scooter", 34, 72, .91],
    ["R-008", "Lina Patel", "LP", "Hub South", 9, 1, 11, 512, true, "bike", 29, 62, .98],
    ["R-031", "Noah Williams", "NW", "Hub West", 6, 4, 23, 834, true, "van", 28, 110, .87],
    ["R-017", "Ishaan Mehta", "IM", "Hub Central", 8, 0, 7, 468, true, "scooter", 33, 74, .94],
    ["R-026", "Sofia Gomez", "SG", "Hub East", 7, 2, 15, 671, true, "bike", 30, 60, .92],
    ["R-043", "Samir Khan", "SK", "Hub North", 8, 1, 5, 389, true, "scooter", 32, 70, .95],
  ].map((r, index) => ({
    riderId: r[0] as string,
    name: r[1] as string,
    initials: r[2] as string,
    location: r[3] as string,
    capacity: r[4] as number,
    currentLoad: r[5] as number,
    recentWorkload: r[6] as number,
    earnings: r[7] as number,
    availability: r[8] as boolean,
    vehicle: r[9] as Rider["vehicle"],
    speed: r[10] as number,
    maxDistanceKm: r[11] as number,
    reliability: r[12] as number,
    color: riderColors[index],
  }));

  const orders: Order[] = Array.from({ length: orderCount }, (_, index) => {
    const priority: Priority = index % 11 === 0 ? "urgent" : index % 5 === 0 ? "high" : "normal";
    const distance = Number((2.2 + random() * 13.4).toFixed(1));
    const orderStart = 600 + (index % 9) * 11;
    const buffer = priority === "urgent" ? 48 + random() * 18 : priority === "high" ? 78 + random() * 28 : 100 + random() * 45;
    const type = index % 4 === 0 ? "gated_apartment" : index % 4 === 1 ? "office_complex" : index % 4 === 2 ? "residential" : "retail";
    const constraint = type === "gated_apartment" ? "security_gate" : index % 7 === 0 ? "lift_required" : index % 9 === 0 ? "fragile" : "none";
    return {
      orderId: `ORD-${String(2601 + index).padStart(4, "0")}`,
      location: locations[index % locations.length],
      destinationType: type,
      distanceKm: distance,
      priority,
      orderTime: minutesToTime(orderStart),
      deadline: minutesToTime(orderStart + buffer),
      serviceTime: Math.round(8 + random() * 12),
      weight: Number((.8 + random() * 7.2).toFixed(1)),
      constraint,
    };
  });

  return { riders, orders };
}

function normalize(value: number, min: number, max: number) {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function gini(values: number[]) {
  if (!values.length || values.every((value) => value === 0)) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  const weighted = sorted.reduce((sum, value, index) => sum + (index + 1) * value, 0);
  return (2 * weighted) / (sorted.length * total) - (sorted.length + 1) / sorted.length;
}

function getVehicleFactor(vehicle: Rider["vehicle"]) {
  return vehicle === "van" ? { cost: 1.8, emissions: 1.35 } : vehicle === "scooter" ? { cost: 1.15, emissions: .72 } : { cost: .84, emissions: .4 };
}

function compatibility(order: Order, rider: Rider) {
  if (!rider.availability) return "Rider unavailable";
  if (rider.currentLoad >= rider.capacity) return "Capacity exceeded";
  if (order.distanceKm > rider.maxDistanceKm) return "Route exceeds rider maximum distance";
  if (order.weight > 6.5 && rider.vehicle === "bike") return "Package weight requires a larger vehicle";
  if (order.constraint === "security_gate" && rider.vehicle === "van") return "Van access restricted at security gate";
  return null;
}

function estimate(order: Order, rider: Rider, routeDelay = 0) {
  const factors = getVehicleFactor(rider.vehicle);
  const travelTime = order.distanceKm / rider.speed * 60 * (1 + routeDelay);
  const destinationFriction = order.destinationType === "gated_apartment" ? 7 : order.destinationType === "office_complex" ? 4 : 2;
  const deliveryTime = travelTime + order.serviceTime + destinationFriction;
  const deadlineRisk = Math.max(0, deliveryTime - (timeToMinutes(order.deadline) - timeToMinutes(order.orderTime)));
  return {
    deliveryTime,
    cost: Number((order.distanceKm * factors.cost + 2.8 + order.serviceTime * .08).toFixed(2)),
    emissions: Number((order.distanceKm * factors.emissions * .128).toFixed(2)),
    deadlineRisk,
  };
}

function calculateMetrics(assignments: Assignment[], riders: Rider[]): Metrics {
  const assigned = assignments.filter((assignment) => assignment.status !== "unassigned");
  const times = assigned.map((assignment) => assignment.deliveryTime);
  const workload = riders.map((rider) => rider.currentLoad + assigned.filter((a) => a.riderId === rider.riderId).length);
  const earnings = riders.map((rider) => rider.earnings + assigned.filter((a) => a.riderId === rider.riderId).length * 38);
  const mean = workload.reduce((a, b) => a + b, 0) / Math.max(workload.length, 1);
  const variance = workload.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / Math.max(workload.length, 1);
  const earningsMean = earnings.reduce((a, b) => a + b, 0) / Math.max(earnings.length, 1);
  const earningsGap = Math.max(...earnings, 0) - Math.min(...earnings, 0);
  const reliability = assigned.length ? assigned.filter((a) => a.onTime).length / assigned.length : 0;
  const fairness = Math.max(0, Math.round((1 - gini(workload)) * 100));
  return {
    assigned: assigned.length,
    unassigned: assignments.length - assigned.length,
    avgTime: times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0,
    maxTime: times.length ? Math.max(...times) : 0,
    late: assigned.filter((a) => !a.onTime).length,
    onTime: reliability,
    cost: Number(assignments.reduce((sum, a) => sum + a.cost, 0).toFixed(0)),
    emissions: Number(assignments.reduce((sum, a) => sum + a.emissions, 0).toFixed(1)),
    reliability,
    fairness,
    workloadVariance: Number(variance.toFixed(2)),
    workloadRange: Math.max(...workload, 0) - Math.min(...workload, 0),
    gini: Number(gini(workload).toFixed(3)),
    earningsGap: Math.round(earningsGap),
    utilisation: Math.round((assigned.length / Math.max(riders.reduce((sum, r) => sum + r.capacity, 0), 1)) * 100),
  };
}

export function runAssignments(orders: Order[], riders: Rider[], algorithm: Algorithm, weights: Weights = DEFAULT_WEIGHTS, routeDelay = 0): RunResult {
  const liveRiders = riders.map((rider) => ({ ...rider }));
  const assignments: Assignment[] = [];
  const ordered = [...orders].sort((a, b) => (a.priority === "urgent" ? -1 : b.priority === "urgent" ? 1 : timeToMinutes(a.orderTime) - timeToMinutes(b.orderTime)));

  ordered.forEach((order) => {
    const candidates = liveRiders.filter((rider) => !compatibility(order, rider)).map((rider) => {
      const estimateResult = estimate(order, rider, routeDelay);
      const afterLoad = rider.currentLoad + assignments.filter((assignment) => assignment.riderId === rider.riderId).length + 1;
      const recentLoad = rider.recentWorkload / 8;
      const avgEarnings = liveRiders.reduce((sum, item) => sum + item.earnings, 0) / liveRiders.length;
      const earningsAfter = rider.earnings + (order.priority === "urgent" ? 52 : 38);
      const breakdown = {
        time: normalize(estimateResult.deliveryTime, 10, 52),
        cost: normalize(estimateResult.cost, 2, 28),
        emissions: normalize(estimateResult.emissions, .2, 3),
        reliability: Math.max(0, Math.min(1, 1 - rider.reliability + estimateResult.deadlineRisk / 100)),
        fairness: Math.min(1, (afterLoad + recentLoad) / 15 + Math.abs(earningsAfter - avgEarnings) / 1400),
      };
      const weightedScore = algorithm === "baseline"
        ? breakdown.time
        : (breakdown.time * weights.time + breakdown.cost * weights.cost + breakdown.emissions * weights.emissions + breakdown.reliability * weights.reliability + breakdown.fairness * weights.fairness) / 100;
      return { rider, estimateResult, breakdown, weightedScore, afterLoad };
    }).sort((a, b) => a.weightedScore - b.weightedScore);

    const selected = candidates[0];
    if (!selected) {
      const reasons = liveRiders.map((rider) => compatibility(order, rider)).filter(Boolean) as string[];
      const reason = reasons.length ? reasons[0] : "No available rider meets the hard constraints";
      assignments.push({ orderId: order.orderId, riderId: null, algorithm, status: "unassigned", reason, deliveryTime: 0, cost: 0, emissions: 0, onTime: false, lateMinutes: 0, score: null, breakdown: null, constraintNote: reason });
      return;
    }

    const deadline = timeToMinutes(order.deadline) - timeToMinutes(order.orderTime);
    const onTime = selected.estimateResult.deliveryTime <= deadline;
    const lateMinutes = Math.max(0, Math.round(selected.estimateResult.deliveryTime - deadline));
    const fairnessChoice = algorithm === "fair" && selected.breakdown.fairness < .48 ? "low recent workload and balanced earnings" : "best operational fit";
    const reason = `${selected.rider.name} has available capacity, meets vehicle and distance rules, and was selected for ${fairnessChoice}.`;
    assignments.push({
      orderId: order.orderId,
      riderId: selected.rider.riderId,
      algorithm,
      status: onTime ? "assigned" : "at-risk",
      reason,
      deliveryTime: Number(selected.estimateResult.deliveryTime.toFixed(1)),
      cost: selected.estimateResult.cost,
      emissions: selected.estimateResult.emissions,
      onTime,
      lateMinutes,
      score: Number((1 - selected.weightedScore).toFixed(2)),
      breakdown: Object.fromEntries(Object.entries(selected.breakdown).map(([key, value]) => [key, Number((1 - value).toFixed(2))])) as Assignment["breakdown"],
      constraintNote: onTime ? "Deadline protected" : `${lateMinutes} min deadline risk`,
    });
  });

  return {
    algorithm,
    assignments: orders.map((order) => assignments.find((assignment) => assignment.orderId === order.orderId)!).filter(Boolean),
    metrics: calculateMetrics(assignments, riders),
    createdAt: new Date().toISOString(),
  };
}

export function simulateScenario(scenario: Scenario, seed = 21, weights = DEFAULT_WEIGHTS): SimulationResult {
  let { riders, orders } = generateDemoData(seed, scenario === "urgent-demand" ? 38 : 28);
  if (scenario === "capacity-loss") {
    riders = riders.map((rider) => rider.riderId === "R-031" ? { ...rider, availability: false } : rider);
  }
  if (scenario === "urgent-demand") {
    orders = orders.map((order, index) => index < 10 ? { ...order, priority: "urgent", deadline: minutesToTime(timeToMinutes(order.orderTime) + 46) } : order);
  }
  const routeDelay = scenario === "route-delay" ? .5 : 0;
  return {
    scenario,
    label: scenario === "normal" ? "Normal operating day" : scenario === "capacity-loss" ? "Capacity loss · R-031 unavailable" : scenario === "route-delay" ? "Route delay · +50% travel time" : "Urgent demand spike · 10 urgent orders",
    baseline: runAssignments(orders, riders, "baseline", weights, routeDelay),
    fair: runAssignments(orders, riders, "fair", weights, routeDelay),
    riders,
    orders,
  };
}

export function workloadByRider(result: RunResult, riders: Rider[]) {
  return riders.map((rider) => ({
    riderId: rider.riderId,
    name: rider.name.split(" ")[0],
    workload: rider.currentLoad + result.assignments.filter((assignment) => assignment.riderId === rider.riderId).length,
    earnings: rider.earnings + result.assignments.filter((assignment) => assignment.riderId === rider.riderId).length * 38,
    color: rider.color,
  }));
}

export function riskRows() {
  return [
    ["Incorrect location estimates", "Medium", "High", "Validate distance inputs against route telemetry before assignment."],
    ["Unrealistic synthetic data", "Medium", "Medium", "Document assumptions and replace with historical samples during pilot."],
    ["Fairness increases delivery time", "Medium", "High", "Use configurable weighted objective and keep time guardrail visible."],
    ["Rider data becomes stale", "High", "Medium", "Refresh workload, availability, and earnings periodically."],
    ["Too many urgent orders", "Medium", "High", "Reserve priority capacity and expose demand-spike simulation."],
    ["No available rider", "Medium", "High", "Show unassigned alert with the violated constraint; never crash."],
    ["Algorithm bias", "Medium", "High", "Monitor workload, earnings, and reliability parity across runs."],
  ];
}

export const assumptions = [
  "Rider locations and availability are available at assignment time.",
  "Distances are estimated and emissions are operational proxies, not fuel-meter readings.",
  "Recent workload is a measurable rolling window and earnings are represented numerically.",
  "Synthetic data is acceptable for student evaluation; production would require live telemetry.",
];

export const validationRows = [
  ["Operations manager", "4.6 / 5", "Baseline comparison", "Needs clearer bulk reassignment flow", "Add shift handoff export"],
  ["Dispatch supervisor", "4.4 / 5", "Explainability drawer", "Wants route-level alerts", "Add map overlay and escalation rules"],
  ["Rider", "4.1 / 5", "Workload transparency", "Earnings assumptions need context", "Show payout policy alongside balance"],
];
