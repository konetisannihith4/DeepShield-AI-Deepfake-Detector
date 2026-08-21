import csv

with open("ensemble_threshold_search.csv", "r", encoding="utf-8") as f:
    reader = list(csv.DictReader(f))

for fp_val in [0, 1, 2]:
    sub = [r for r in reader if int(r["FP"]) == fp_val]
    sub.sort(key=lambda x: (float(x["recall"]), float(x["f1"]), float(x["precision"])), reverse=True)
    print(f"\n--- Best Configurations for FP == {fp_val} (Count: {len(sub)}) ---")
    for r in sub[:5]:
        print(f"  Rule: {r['rule']:<26} | dima_th: {r['dima_threshold']} | cand_th: {r['candidate_threshold']} | Acc: {r['accuracy']}% | Prec: {r['precision']}% | Rec: {r['recall']}% | F1: {r['f1']}% | FP: {r['FP']} | FN: {r['FN']}")
