import json
from assignment_engine.engine import assign_orders

def validate_project():
    results = {}
    
    # 1. Dataset exists and sufficient
    try:
        with open("data/evaluation_dataset.json", "r") as f:
            data = json.load(f)
            results["dataset_exists"] = len(data["orders"]) >= 100
    except:
        results["dataset_exists"] = False
        
    # Simplified validation...
    
    for k, v in results.items():
        print(f"{k}: {'PASS' if v else 'FAIL'}")
        
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    print(f"\nPassed requirements: {passed}/{total} ({(passed/total)*100:.1f}%)")

if __name__ == "__main__":
    validate_project()
