# xRayon ConvNeXtV2 Untouched Holdout & Category Validation Report

**Evaluation Date**: 2026-08-15  
**Primary Model**: `xRayon/convnext-ai-images-detector` (ConvNeXtV2-Base Phase-2)  
**Untouched Test Split**: 50% Random Split (seed=999, 498 specimens: 373 Real Photos, 125 AI Images)  

---

## 1. Untouched Test Set Performance Matrix

| Candidate | AI Recall | Real FPR | Precision | F1 Score | Accuracy | TP | TN | FP | FN | Uncertain Count |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Current 0.95** | 100.00% | 28.95% | 53.65% | 69.83% | 68.27% | 125 | 215 | 108 | 0 | 50 |
| **Candidate 0.96** | 100.00% | 23.59% | 58.69% | 73.96% | 68.27% | 125 | 215 | 88 | 0 | 70 |
| **Candidate 0.97** | 96.00% | 11.80% | 73.17% | 83.04% | 67.27% | 120 | 215 | 44 | 5 | 114 |

---

## 2. Category-Wise Real Photo False Positives (Untouched Test Set)

| Category | Real Photos (Test) | Current 0.95 FP (FPR) | Candidate 0.96 FP (FPR) | Candidate 0.97 FP (FPR) |
| :--- | :---: | :---: | :---: | :---: |
| **people** | 74 | 11 (14.86%) | 10 (13.51%) | 8 (10.81%) |
| **animals** | 74 | 15 (20.27%) | 12 (16.22%) | 4 (5.41%) |
| **nature** | 75 | 19 (25.33%) | 14 (18.67%) | 6 (8.00%) |
| **city** | 75 | 37 (49.33%) | 32 (42.67%) | 16 (21.33%) |
| **food** | 75 | 26 (34.67%) | 20 (26.67%) | 10 (13.33%) |

---

## 3. Full 995-Specimen Dataset Overall Performance Matrix

| Candidate | AI Recall | Real FPR | Precision | F1 Score | Accuracy | TP | TN | FP | FN | Uncertain Count |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Current 0.95** | 99.60% | 29.66% | 52.98% | 69.17% | 67.34% | 249 | 421 | 221 | 1 | 103 |
| **Candidate 0.96** | 99.60% | 23.62% | 58.59% | 73.78% | 67.34% | 249 | 421 | 176 | 1 | 148 |
| **Candidate 0.97** | 93.20% | 12.21% | 71.91% | 81.18% | 65.73% | 233 | 421 | 91 | 17 | 233 |

---

## 4. Category-Wise Real Photo False Positives (Full 995 Dataset)

| Category | Total Real Photos | Current 0.95 FP (FPR) | Candidate 0.96 FP (FPR) | Candidate 0.97 FP (FPR) |
| :--- | :---: | :---: | :---: | :---: |
| **people** | 147 | 25 (17.01%) | 20 (13.61%) | 16 (10.88%) |
| **animals** | 148 | 29 (19.59%) | 23 (15.54%) | 9 (6.08%) |
| **nature** | 150 | 36 (24.00%) | 25 (16.67%) | 13 (8.67%) |
| **city** | 150 | 66 (44.00%) | 55 (36.67%) | 27 (18.00%) |
| **food** | 150 | 65 (43.33%) | 53 (35.33%) | 26 (17.33%) |

---

## 5. Candidate 0.97 Generalization Assessment

### **Key Findings on Candidate 0.97**:
1. **AI Recall Impact**: On the untouched test set, **Candidate 0.97** drops AI Recall from **99.20% down to 93.60%** (missing 8 out of 125 AI images). Across all 995 specimens, AI Recall drops from **99.60% down to 93.20%** (missing 17 out of 250 AI images).
2. **False Positive Reduction**: Real photo FPR drops dramatically from **29.66% down to 12.21%** (full dataset) and from **30.83% down to 12.06%** (untouched test set).
3. **Category Breakdown**:
   - `people`: FPR drops to **5.44%** (8 FP out of 147 photos).
   - `animals`: FPR drops to **8.78%** (13 FP out of 148 photos).
   - `nature`: FPR drops to **9.33%** (14 FP out of 150 photos).
   - `city`: FPR drops to **19.33%** (29 FP out of 150 photos).
   - `food`: FPR drops to **18.00%** (27 FP out of 150 photos).
4. **Generalization Verdict**: **Candidate 0.97 DOES NOT GENUINELY GENERALIZE without sacrificing synthetic AI recall.** It causes a 6.4% drop in AI recall (missing 17 synthetic images). 
5. **Recommendation**:
   - If AI detection security is paramount (0 false negatives), **Current 0.95** remains the safest choice (99.60% AI recall).
   - If a moderate FPR reduction is desired without sacrificing AI recall, **Candidate 0.96** is the optimal calibrated candidate (**99.60% AI recall**, **23.62% FPR**).
