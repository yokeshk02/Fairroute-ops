"""Optional FastAPI adapter for local/container deployments.

The WebDev preview uses the client-side engine so the demo works immediately. This adapter
exposes the same assignment contract for teams that want to persist orders and runs in SQLite.
"""
from datetime import datetime, timezone
from typing import Any
from fastapi import FastAPI
from pydantic import BaseModel, Field
from assignment_engine.engine import Weights, assign_orders

app = FastAPI(title="FairRoute API", version="0.1.0")

class AssignmentRequest(BaseModel):
    orders: list[dict[str, Any]] = Field(default_factory=list)
    riders: list[dict[str, Any]] = Field(default_factory=list)
    weights: dict[str, float] = Field(default_factory=dict)
    route_delay: float = 0

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "fairroute-api", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.post("/assign/{algorithm}")
def assign(algorithm: str, request: AssignmentRequest) -> dict[str, Any]:
    weights = Weights(**{key: value / 100 for key, value in request.weights.items() if key in {"time", "cost", "emissions", "reliability", "fairness"}})
    results = assign_orders(request.orders, request.riders, algorithm, weights, request.route_delay)
    return {"algorithm": algorithm, "assignments": results, "count": len(results)}

@app.post("/simulate/disruption")
def simulate(request: AssignmentRequest) -> dict[str, Any]:
    baseline = assign_orders(request.orders, request.riders, "baseline", Weights(), request.route_delay)
    fair = assign_orders(request.orders, request.riders, "fair", Weights(), request.route_delay)
    return {"baseline": baseline, "fair": fair, "scenario": {"route_delay": request.route_delay}}
