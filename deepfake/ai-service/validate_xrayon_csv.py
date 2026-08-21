import os
import csv

def validate():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, "xrayon_41_image_benchmark.csv")

    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        return

    rows = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            raw_ai = float(r["AI_probability"].replace("%", "")) / 100.0
            r["raw_ai"] = raw_ai
            rows.append(r)

    print("=" * 90)
    print("STRICT CSV AUDIT & METRICS VALIDATION FOR xRayon CONVNEXTV2 PHASE-2")
    print("=" * 90)
    print(f"Total CSV Rows Parsed: {len(rows)}")

    prev_26 = [r for r in rows if r["set_group"] == "Previous 26"]
    unseen_15 = [r for r in rows if r["set_group"] == "Unseen 15"]

    def compute_strict_3way(dataset):
        tot = len(dataset)
        ai_specs = [r for r in dataset if r["ground_truth"] == "AI"]
        real_specs = [r for r in dataset if r["ground_truth"] == "NATURAL"]
        n_ai = len(ai_specs)
        n_real = len(real_specs)

        tp, tn, fp, fn, unc = 0, 0, 0, 0, 0
        fp_list, fn_list, unc_list = [], [], []

        for r in dataset:
            p = r["prediction"]
            gt = r["ground_truth"]
            fname = r["filename"]
            prob = r["raw_ai"]

            if p == "Likely AI Generated":
                if gt == "AI":
                    tp += 1
                else:
                    fp += 1
                    fp_list.append((fname, prob, p))
            elif p == "Likely Natural":
                if gt == "NATURAL":
                    tn += 1
                else:
                    fn += 1
                    fn_list.append((fname, prob, p))
            else: # "Uncertain"
                unc += 1
                unc_list.append((fname, prob, gt))
                if gt == "AI":
                    fn += 1

        decided = tot - unc
        overall_acc = (tp + tn) / tot * 100.0 if tot > 0 else 0.0
        decided_acc = (tp + tn) / decided * 100.0 if decided > 0 else 0.0
        prec = (tp / (tp + fp) * 100.0) if (tp + fp) > 0 else 0.0
        rec = (tp / (tp + fn) * 100.0) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0
        fpr = (fp / n_real * 100.0) if n_real > 0 else 0.0
        fnr = (fn / n_ai * 100.0) if n_ai > 0 else 0.0

        return {
            "total": tot, "n_ai": n_ai, "n_real": n_real,
            "tp": tp, "tn": tn, "fp": fp, "fn": fn, "unc": unc,
            "decided": decided,
            "overall_acc": overall_acc, "decided_acc": decided_acc,
            "prec": prec, "rec": rec, "f1": f1,
            "fpr": fpr, "fnr": fnr,
            "fp_list": fp_list, "fn_list": fn_list, "unc_list": unc_list
        }

    def compute_binary_50(dataset):
        tot = len(dataset)
        ai_specs = [r for r in dataset if r["ground_truth"] == "AI"]
        real_specs = [r for r in dataset if r["ground_truth"] == "NATURAL"]
        n_ai = len(ai_specs)
        n_real = len(real_specs)

        tp, tn, fp, fn = 0, 0, 0, 0
        fp_list, fn_list = [], []

        for r in dataset:
            prob = r["raw_ai"]
            gt = r["ground_truth"]
            fname = r["filename"]

            is_ai_pred = (prob >= 0.50)

            if is_ai_pred:
                if gt == "AI":
                    tp += 1
                else:
                    fp += 1
                    fp_list.append((fname, prob))
            else:
                if gt == "NATURAL":
                    tn += 1
                else:
                    fn += 1
                    fn_list.append((fname, prob))

        acc = (tp + tn) / tot * 100.0 if tot > 0 else 0.0
        prec = (tp / (tp + fp) * 100.0) if (tp + fp) > 0 else 0.0
        rec = (tp / (tp + fn) * 100.0) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0
        fpr = (fp / n_real * 100.0) if n_real > 0 else 0.0
        fnr = (fn / n_ai * 100.0) if n_ai > 0 else 0.0

        return {
            "total": tot, "n_ai": n_ai, "n_real": n_real,
            "tp": tp, "tn": tn, "fp": fp, "fn": fn,
            "acc": acc, "prec": prec, "rec": rec, "f1": f1,
            "fpr": fpr, "fnr": fnr,
            "fp_list": fp_list, "fn_list": fn_list
        }

    # 1. Full 41 Specimens Audit
    m41_3w = compute_strict_3way(rows)
    m41_bin = compute_binary_50(rows)

    # 2. Previous 26 Specimens Audit
    m26_3w = compute_strict_3way(prev_26)
    m26_bin = compute_binary_50(prev_26)

    # 3. Unseen 15 Specimens Audit
    m15_3w = compute_strict_3way(unseen_15)
    m15_bin = compute_binary_50(unseen_15)

    print("\n" + "=" * 90)
    print("1. OVERALL 41-SPECIMEN BENCHMARK METRICS")
    print("=" * 90)
    print("STRICT 3-WAY CLASSIFICATION (>=0.95 AI, <=0.50 Natural, else Uncertain):")
    print(f"  Total: {m41_3w['total']} | AI: {m41_3w['n_ai']} | Real: {m41_3w['n_real']}")
    print(f"  TP: {m41_3w['tp']} | TN: {m41_3w['tn']} | FP: {m41_3w['fp']} | FN: {m41_3w['fn']} | UNCERTAIN: {m41_3w['unc']}")
    print(f"  Overall Accuracy : {m41_3w['overall_acc']:.2f}% ({m41_3w['tp']+m41_3w['tn']}/{m41_3w['total']})")
    print(f"  Decided Accuracy : {m41_3w['decided_acc']:.2f}% ({m41_3w['tp']+m41_3w['tn']}/{m41_3w['decided']})")
    print(f"  Precision        : {m41_3w['prec']:.2f}% ({m41_3w['tp']}/{m41_3w['tp']+m41_3w['fp']})")
    print(f"  Recall           : {m41_3w['rec']:.2f}% ({m41_3w['tp']}/{m41_3w['n_ai']})")
    print(f"  F1 Score         : {m41_3w['f1']:.2f}%")
    print(f"  False Pos Rate   : {m41_3w['fpr']:.2f}% ({m41_3w['fp']}/{m41_3w['n_real']})")
    print(f"  False Neg Rate   : {m41_3w['fnr']:.2f}% ({m41_3w['fn']}/{m41_3w['n_ai']})")

    print("\nBINARY CLASSIFICATION AT 0.50 THRESHOLD (>=0.50 AI, <0.50 Natural):")
    print(f"  TP: {m41_bin['tp']} | TN: {m41_bin['tn']} | FP: {m41_bin['fp']} | FN: {m41_bin['fn']}")
    print(f"  Accuracy       : {m41_bin['acc']:.2f}% ({m41_bin['tp']+m41_bin['tn']}/{m41_bin['total']})")
    print(f"  Precision      : {m41_bin['prec']:.2f}% ({m41_bin['tp']}/{m41_bin['tp']+m41_bin['fp']})")
    print(f"  Recall         : {m41_bin['rec']:.2f}% ({m41_bin['tp']}/{m41_bin['n_ai']})")
    print(f"  F1 Score       : {m41_bin['f1']:.2f}%")
    print(f"  False Pos Rate : {m41_bin['fpr']:.2f}% ({m41_bin['fp']}/{m41_bin['n_real']})")
    print(f"  False Neg Rate : {m41_bin['fnr']:.2f}% ({m41_bin['fn']}/{m41_bin['n_ai']})")

    print("\n" + "=" * 90)
    print("2. PREVIOUS 26 SPECIMENS AUDIT METRICS")
    print("=" * 90)
    print("STRICT 3-WAY:")
    print(f"  TP: {m26_3w['tp']} | TN: {m26_3w['tn']} | FP: {m26_3w['fp']} | FN: {m26_3w['fn']} | UNCERTAIN: {m26_3w['unc']}")
    print(f"  Overall Accuracy : {m26_3w['overall_acc']:.2f}%")
    print(f"  Decided Accuracy : {m26_3w['decided_acc']:.2f}%")
    print(f"  Precision        : {m26_3w['prec']:.2f}%")
    print(f"  Recall           : {m26_3w['rec']:.2f}%")
    print(f"  F1 Score         : {m26_3w['f1']:.2f}%")

    print("BINARY AT 0.50 THRESHOLD:")
    print(f"  TP: {m26_bin['tp']} | TN: {m26_bin['tn']} | FP: {m26_bin['fp']} | FN: {m26_bin['fn']}")
    print(f"  Accuracy  : {m26_bin['acc']:.2f}%")
    print(f"  Precision : {m26_bin['prec']:.2f}%")
    print(f"  Recall    : {m26_bin['rec']:.2f}%")
    print(f"  F1 Score  : {m26_bin['f1']:.2f}%")

    print("\n" + "=" * 90)
    print("3. UNSEEN 15 SPECIMENS AUDIT METRICS")
    print("=" * 90)
    print("STRICT 3-WAY:")
    print(f"  TP: {m15_3w['tp']} | TN: {m15_3w['tn']} | FP: {m15_3w['fp']} | FN: {m15_3w['fn']} | UNCERTAIN: {m15_3w['unc']}")
    print(f"  Overall Accuracy : {m15_3w['overall_acc']:.2f}%")
    print(f"  Precision        : {m15_3w['prec']:.2f}%")
    print(f"  UNSEEN AI RECALL : {m15_3w['rec']:.2f}% ({m15_3w['tp']}/{m15_3w['n_ai']} AI detected)")
    print(f"  F1 Score         : {m15_3w['f1']:.2f}%")

    print("BINARY AT 0.50 THRESHOLD:")
    print(f"  TP: {m15_bin['tp']} | TN: {m15_bin['tn']} | FP: {m15_bin['fp']} | FN: {m15_bin['fn']}")
    print(f"  Accuracy  : {m15_bin['acc']:.2f}%")
    print(f"  Precision : {m15_bin['prec']:.2f}%")
    print(f"  Recall    : {m15_bin['rec']:.2f}%")
    print(f"  F1 Score  : {m15_bin['f1']:.2f}%")

    print("\n" + "=" * 90)
    print("4. DETAILED SPECIMEN BREAKDOWNS")
    print("=" * 90)
    print("\n[A] FALSE POSITIVES IN STRICT 3-WAY (>= 0.95 AI):")
    for fname, prob, pred in m41_3w["fp_list"]:
        print(f"  - [FP] {fname:<30} (AI Prob: {prob*100:6.2f}%, Prediction: {pred})")

    print("\n[B] FALSE NEGATIVES IN STRICT 3-WAY (<= 0.50 Natural or Missed):")
    for fname, prob, pred in m41_3w["fn_list"]:
        print(f"  - [FN] {fname:<30} (AI Prob: {prob*100:6.2f}%, Prediction: {pred})")

    print("\n[C] UNCERTAIN SPECIMENS (0.50 < AI Prob < 0.95):")
    for fname, prob, gt in m41_3w["unc_list"]:
        print(f"  - [UNC] {fname:<30} (AI Prob: {prob*100:6.2f}%, Ground Truth: {gt})")

    print("\n[D] KNOWN AI RECOVERY CASES (PREVIOUS 26):")
    recovery_files = ["ai_boy_portrait2.png", "ai_sdxl_landscape.jpg", "ai_sdxl_img2img.jpg", "ai_gan_bedroom.jpg"]
    for fname in recovery_files:
        r = next(item for item in rows if item["filename"] == fname)
        print(f"  - [OK] {fname:<25} | AI Prob: {r['raw_ai']*100:6.2f}% | Prediction: {r['prediction']}")

    print("\n[E] UNSEEN AI SET (10 SPECIMENS):")
    for r in unseen_15:
        if r["ground_truth"] == "AI":
            status = "[OK] RECOVERED" if r["prediction"] == "Likely AI Generated" else "[MISS] MISSED"
            print(f"  - {r['filename']:<30} ({r['category']:<25}) | AI Prob: {r['raw_ai']*100:6.2f}% | {status}")

    print("\n[F] UNSEEN NATURAL SET (5 SPECIMENS):")
    for r in unseen_15:
        if r["ground_truth"] == "NATURAL":
            status = "[OK] CLEAN NATURAL" if r["prediction"] == "Likely Natural" else f"[FLAG] FLAGGED ({r['prediction']})"
            print(f"  - {r['filename']:<30} ({r['category']:<28}) | AI Prob: {r['raw_ai']*100:6.2f}% | {status}")

    print("=" * 90)

if __name__ == "__main__":
    validate()
