import pytest
from assignment_engine.engine import assign_orders, constraint_reason

def rider(**overrides):
    base = {"rider_id": "R1", "availability": True, "capacity": 4, "current_load": 0, "recent_workload": 3, "earnings": 500, "vehicle_type": "bike", "speed_kmph": 30, "max_distance_km": 60, "reliability": .95}
    return {**base, **overrides}

def order(**overrides):
    base = {"order_id": "ORD1", "distance_km": 4, "destination_type": "residential", "priority": "normal", "estimated_service_time": 10, "weight": 2, "special_constraint": None, "order_time": "10:00"}
    return {**base, **overrides}

def test_unavailable_rider():
    assert constraint_reason(order(), rider(availability=False)) == "Rider unavailable"

def test_capacity_exceeded():
    assert constraint_reason(order(), rider(current_load=4, capacity=4)) == "Capacity exceeded"

def test_no_feasible_rider():
    result = assign_orders([order()], [rider(availability=False)], "fair")
    assert result[0]["status"] == "unassigned"

def test_package_too_heavy_for_bike():
    assert constraint_reason(order(weight=10), rider(vehicle_type="bike")) == "Package weight requires a larger vehicle"

def test_gate_restriction_mismatch():
    assert constraint_reason(order(special_constraint="security_gate"), rider(vehicle_type="van")) == "Van access restricted at security gate"

def test_max_distance_exceeded():
    assert constraint_reason(order(distance_km=100), rider(max_distance_km=50)) == "Route exceeds rider maximum distance"
