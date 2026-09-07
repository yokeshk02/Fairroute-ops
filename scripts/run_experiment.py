import json
import csv
from assignment_engine.engine import assign_orders

def run_experiment(dataset_path, output_prefix, algorithm):
    with open(dataset_path, "r") as f:
        data = json.load(f)
        
    results = assign_orders(data["orders"], data["riders"], algorithm=algorithm)
    
    # Simple metrics calculation for demonstration
    total_assigned = sum(1 for r in results if r["status"] == "assigned")
    success_rate = total_assigned / len(results)
    
    with open(f"results/{output_prefix}_results.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=results[0].keys())
        writer.writeheader()
        writer.writerows(results)
        
    return {"algorithm": algorithm, "success_rate": success_rate}

if __name__ == "__main__":
    dataset = "data/evaluation_dataset.json"
    res_base = run_experiment(dataset, "baseline", "baseline")
    res_fair = run_experiment(dataset, "fairness", "fair")
    
    print(f"Baseline: {res_base}")
    print(f"Fairness: {res_fair}")
