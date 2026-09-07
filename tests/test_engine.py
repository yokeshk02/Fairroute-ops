from assignment_engine.engine import Weights, assign_orders, constraint_reason, estimate


def rider(**overrides):
    base = {"rider_id": "R1", "name": "Rider 1", "availability": True, "capacity": 4, "current_load": 0, "recent_workload": 3, "earnings": 500, "vehicle_type": "bike", "speed_kmph": 30, "max_distance_km": 60, "reliability": .95}
    return {**base, **overrides}


def order(**overrides):
    base = {"order_id": "ORD1", "distance_km": 4, "destination_type": "residential", "priority": "normal", "estimated_service_time": 10, "weight": 2, "special_constraint": "none", "order_time": "10:00"}
    return {**base, **overrides}


def test_constraint_checker_rejects_unavailable_and_capacity():
    assert constraint_reason(order(), rider(availability=False)) == "Rider unavailable"
    assert constraint_reason(order(), rider(current_load=4)) == "Capacity exceeded"


def test_estimate_includes_service_time_and_vehicle_cost():
    result = estimate(order(), rider())
    assert result["time"] > 10
    assert result["cost"] > 0
    assert result["emissions"] > 0


def test_no_rider_fails_gracefully():
    result = assign_orders([order()], [rider(availability=False)], "fair")
    assert result[0]["status"] == "unassigned"
    assert result[0]["rider_id"] is None


def test_baseline_and_fair_are_valid_algorithms():
    orders = [order(order_id="ORD1"), order(order_id="ORD2", priority="urgent")]
    riders = [rider(rider_id="FAST", speed_kmph=45, recent_workload=26), rider(rider_id="BAL", speed_kmph=28, recent_workload=1)]
    baseline = assign_orders(orders, riders, "baseline")
    fair = assign_orders(orders, riders, "fair", Weights())
    assert len(baseline) == len(fair) == 2
    assert all(item["status"] == "assigned" for item in fair)
    assert {item["rider_id"] for item in baseline} | {item["rider_id"] for item in fair}
