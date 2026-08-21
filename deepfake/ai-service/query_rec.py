import csv

with open("ensemble_threshold_search.csv", "r", encoding="utf-8") as f:
    reader = list(csv.DictReader(f))

valid = [r for r in reader if int(r["FP"]) <= 2]

# Sort by Recall desc, then F1 desc
valid_rec = sorted(valid, key=lambda x: (float(x["recall"]), float(x["f1"]), float(x["precision"])), reverse=True)

print("Top 10 High-Recall Configurations with FP <= 2:")
for r in valid_rec[:10]:
    print(f"Rule: {r['rule']:<26} | dima_th: {r['dima_threshold']} | cand_th: {r['candidate_threshold']} | Acc: {r['accuracy']}% | Prec: {r['precision']}% | Rec: {r['recall']}% | F1: {r['f1']}% | FP: {r['FP']} | FN: {r['FN']}")
