import random
import json
import os

def generate_dataset():
    random.seed(42)
    
    orders = []
    for i in range(1, 101):
        orders.append({
            "order_id": f"ORD-{1000 + i}",
            "distance_km": round(random.uniform(1.0, 20.0), 2),
            "destination_type": random.choice(["gated_apartment", "office_complex", "residential"]),
            "weight": round(random.uniform(0.5, 15.0), 2),
            "priority": random.choice(["normal", "high", "urgent"]),
            "order_time": "10:00",
            "delivery_deadline": random.randint(30, 120),
            "estimated_service_time": random.randint(5, 20),
            "special_constraint": random.choice(["security_gate", None])
        })
        
    riders = []
    vehicle_types = ["bike", "scooter", "van"]
    for i in range(1, 21):
        riders.append({
            "rider_id": f"R-{2000 + i}",
            "vehicle_type": random.choice(vehicle_types),
            "capacity": random.randint(5, 15),
            "current_load": random.randint(0, 5),
            "recent_workload": random.randint(0, 10),
            "earnings": random.randint(300, 1000),
            "availability": random.choice([True, True, True, False]),
            "max_distance_km": random.randint(10, 50),
            "speed_kmph": random.randint(20, 40),
            "reliability": round(random.uniform(0.7, 1.0), 2)
        })
        
    dataset = {"orders": orders, "riders": riders}
    
    with open("data/evaluation_dataset.json", "w") as f:
        json.dump(dataset, f, indent=2)
    print("Dataset generated: data/evaluation_dataset.json")

if __name__ == "__main__":
    if not os.path.exists("data"):
        os.makedirs("data")
    generate_dataset()

