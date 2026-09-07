"""FairRoute reference engine.

The deployed UI runs the same deterministic objective in TypeScript for a zero-setup demo.
This module keeps the algorithm portable for FastAPI, batch experiments, and future workers.
"""
from dataclasses import dataclass
from typing import Any

@dataclass
class Weights:
    time: float = .30
    cost: float = .15
    emissions: float = .10
    reliability: float = .20
    fairness: float = .25


def vehicle_factor(vehicle: str) -> tuple[float, float]:
    return {"bike": (.84, .40), "scooter": (1.15, .72), "van": (1.80, 1.35)}.get(vehicle, (1.0, .8))


def constraint_reason(order: dict[str, Any], rider: dict[str, Any]) -> str | None:
    if not rider.get("availability", False):
        return "Rider unavailable"
    if rider.get("current_load", 0) >= rider.get("capacity", 0):
        return "Capacity exceeded"
    if order["distance_km"] > rider.get("max_distance_km", 0):
        return "Route exceeds rider maximum distance"
    if order.get("weight", 0) > 6.5 and rider.get("vehicle_type") == "bike":
        return "Package weight requires a larger vehicle"
    if order.get("special_constraint") == "security_gate" and rider.get("vehicle_type") == "van":
        return "Van access restricted at security gate"
    return None


def estimate(order: dict[str, Any], rider: dict[str, Any], route_delay: float = 0) -> dict[str, float]:
    cost_factor, emission_factor = vehicle_factor(rider.get("vehicle_type", "bike"))
    travel = order["distance_km"] / rider["speed_kmph"] * 60 * (1 + route_delay)
    friction = {"gated_apartment": 7, "office_complex": 4}.get(order.get("destination_type"), 2)
    time = travel + order.get("estimated_service_time", 10) + friction
    budget = 100 if order.get("priority") == "normal" else 75 if order.get("priority") == "high" else 48
    return {"time": time, "cost": order["distance_km"] * cost_factor + 2.8, "emissions": order["distance_km"] * emission_factor * .128, "risk": max(0, time - budget)}


def assign_orders(orders: list[dict[str, Any]], riders: list[dict[str, Any]], algorithm: str = "fair", weights: Weights | None = None, route_delay: float = 0) -> list[dict[str, Any]]:
    weights = weights or Weights()
    live = [dict(rider) for rider in riders]
    assignments: list[dict[str, Any]] = []
    ordered = sorted(orders, key=lambda item: (0 if item.get("priority") == "urgent" else 1, item.get("order_time", "")))
    for order in ordered:
        eligible = []
        for rider in live:
            if constraint_reason(order, rider):
                continue
            estimate_result = estimate(order, rider, route_delay)
            assigned_count = sum(assignment.get("rider_id") == rider["rider_id"] for assignment in assignments)
            after_load = rider.get("current_load", 0) + assigned_count + 1
            fairness = min(1, (after_load + rider.get("recent_workload", 0) / 8) / 15 + abs(rider.get("earnings", 0) - 600) / 1400)
            score = estimate_result["time"] if algorithm == "baseline" else sum((
                estimate_result["time"] / 52 * weights.time,
                estimate_result["cost"] / 28 * weights.cost,
                estimate_result["emissions"] / 3 * weights.emissions,
                (1 - rider.get("reliability", .8) + estimate_result["risk"] / 100) * weights.reliability,
                fairness * weights.fairness,
            ))
            eligible.append((score, rider, estimate_result))
        if not eligible:
            assignments.append({"order_id": order["order_id"], "rider_id": None, "status": "unassigned", "reason": "No available rider meets the hard constraints"})
            continue
        score, rider, result = min(eligible, key=lambda candidate: candidate[0])
        assignments.append({"order_id": order["order_id"], "rider_id": rider["rider_id"], "status": "assigned", "score": round(1 - min(1, score), 2), "delivery_time": round(result["time"], 1), "cost": round(result["cost"], 2), "emissions": round(result["emissions"], 2), "reason": "Eligible capacity, route compatibility, deadline protection, and objective fit."})
    return assignments
