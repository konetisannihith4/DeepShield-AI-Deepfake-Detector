import csv

with open("ensemble_threshold_search.csv", "r", encoding="utf-8") as f:
    reader = list(csv.DictReader(f))

valid = [r for r in reader if int(r["FP"]) <= 2]

valid.sort(key=lambda x: (float(x["f1"]), float(x["recall"]), float(x["precision"])), reverse=True)

print(f"Total valid configurations with FP <= 2: {len(valid)}")
print("\nTop 15 Valid Configurations (FP <= 2):")
for r in valid[:15]:
    print(f"Rule: {r['rule']:<26} | dima_th: {r['dima_threshold']} | cand_th: {r['candidate_threshold']} | Acc: {r['accuracy']}% | Prec: {r['precision']}% | Rec: {r['recall']}% | F1: {r['f1']}% | FP: {r['FP']} | FN: {r['FN']}")
