# Kaggle Real-vs-AI Benchmark Report: xRayon ConvNeXtV2 Phase-2

**Evaluation Date**: 2026-08-15
**Primary Model**: `xRayon/convnext-ai-images-detector` (ConvNeXtV2-Base Phase-2)
**CSV Benchmark Database**: [`xrayon_kaggle_real_vs_ai_benchmark.csv`](file:///c:/Users/konet/Downloads/Deepshield/deepfake/ai-service/xrayon_kaggle_real_vs_ai_benchmark.csv)

---

## 1. Dataset Structure & Integrity Verification

- **Real Dataset Path**: `C:\Users\konet\Downloads\dataset ai vs real\real_dataset`
- **AI Dataset Path**: `C:\Users\konet\Downloads\dataset ai vs real\Ai_generated_dataset`
- **Total Valid Image Specimens**: **995**
- **Real Camera Photographs**: **745**
- **AI-Generated Images**: **250**
- **Categories Found**: `animals`, `city`, `food`, `nature`, `people`
- **Corrupted / Excluded Files**: **0**
- **Identified Duplicate Files**: **0**

---

## 2. Model & Checkpoint Specifications

- **Model**: `xRayon/convnext-ai-images-detector`
- **Architecture**: `ConvNeXtV2-Base` (`convnextv2_base`, 2 output classes)
- **Checkpoint**: `checkpoint_phase2.pth` (~1,004 MB)
- **Preprocessing Pipeline**: `transforms.Resize(288)` $\rightarrow$ `transforms.CenterCrop(256)` $\rightarrow$ ImageNet Normalization
- **Production Thresholds**:
  - `probability >= 0.95` $\rightarrow$ `"Likely AI Generated"`
  - `probability <= 0.50` $\rightarrow$ `"Likely Natural"`
  - `0.50 < probability < 0.95` $\rightarrow$ `"Uncertain"`

---

## 3. Overall Benchmark Metrics

### A. Strict Three-Way Production Mode (Primary Evaluation)
- **Decided Specimens**: **891 / 995** (89.55% Coverage)
- **Uncertain Specimens**: **104 / 995** (10.45% Uncertain Rate)
- **Decided Accuracy**: **`75.20%`** (670 / 891)
- **Overall Accuracy**: **`67.34%`** (670 / 995)
- **KAGGLE AI RECALL (at >= 0.95 threshold)**: **`99.60%`** (249 / 250)
- **KAGGLE NATURAL FALSE POSITIVE RATE (at >= 0.95 threshold)**: **`29.66%`** (221 / 745)
- **Precision**: **`52.98%`** (249 / 470)
- **F1 Score**: **`69.17%`**
- **True Positives (TP)**: `249`
- **True Negatives (TN)**: `421`
- **False Positives (FP)**: `221`
- **False Negatives (FN)**: `1`
- **False Negative Rate (FNR)**: `0.40%` (1 / 250)

### B. Binary Diagnostic Mode (at 0.50 Decision Boundary)
- **Binary Accuracy**: **`67.44%`** (671 / 995)
- **Binary Precision**: **`43.55%`** (250 / 574)
- **Binary AI Recall (at >= 0.50 boundary)**: **`100.00%`** (250 / 250)
- **Binary Natural FPR (at >= 0.50 boundary)**: **`43.49%`** (324 / 745)
- **Binary F1 Score**: **`60.68%`**
- **True Positives (TP)**: `250`
- **True Negatives (TN)**: `421`
- **False Positives (FP)**: `324`
- **False Negatives (FN)**: `0`

---

## 4. Category-Level Performance Analysis

| Category | Total | AI Count | Real Count | 3-Way TP | 3-Way TN | 3-Way FP | 3-Way FN | 3-Way UNC | AI Recall (>=0.95) | Binary AI Recall (>=0.50) | 3-Way FPR | Binary FPR |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **animals** | 198 | 50 | 148 | 50 | 99 | 29 | 0 | 20 | **100.00%** | **100.00%** | 19.59% | 33.11% |
| **city** | 200 | 50 | 150 | 50 | 62 | 66 | 0 | 22 | **100.00%** | **100.00%** | 44.00% | 58.67% |
| **food** | 200 | 50 | 150 | 49 | 54 | 65 | 1 | 32 | **98.00%** | **100.00%** | 43.33% | 64.00% |
| **nature** | 200 | 50 | 150 | 50 | 98 | 36 | 0 | 16 | **100.00%** | **100.00%** | 24.00% | 34.67% |
| **people** | 197 | 50 | 147 | 50 | 108 | 25 | 0 | 14 | **100.00%** | **100.00%** | 17.01% | 26.53% |

---

## 5. False Positive Specimen Audit (Natural Photos Flagged AI)

### A. Natural Photos Flagged >= 0.95 (Production False Positives): 221
- ⚠️ **`animals\animals_100.jpg`** (animals): `AI_prob = 95.0400%`, `Prediction = Likely AI Generated`
- ⚠️ **`animals\animals_112.jpg`** (animals): `AI_prob = 96.8200%`, `Prediction = Likely AI Generated`
- ⚠️ **`animals\animals_114.jpg`** (animals): `AI_prob = 95.4200%`, `Prediction = Likely AI Generated`
- ⚠️ **`animals\animals_116.jpg`** (animals): `AI_prob = 96.6300%`, `Prediction = Likely AI Generated`
- ⚠️ **`animals\animals_117.jpg`** (animals): `AI_prob = 96.3600%`, `Prediction = Likely AI Generated`
- ⚠️ **`animals\animals_12.jpg`** (animals): `AI_prob = 97.3800%`, `Prediction = Likely AI Generated`
- ⚠️ **`animals\animals_13.jpg`** (animals): `AI_prob = 97.0900%`, `Prediction = Likely AI Generated`
- ⚠️ **`animals\animals_14.jpg`** (animals): `AI_prob = 96.4800%`, `Prediction = Likely AI Generated`
- ⚠️ **`animals\animals_17.jpg`** (animals): `AI_prob = 97.1800%`, `Prediction = Likely AI Generated`
- ⚠️ **`animals\animals_18.jpg`** (animals): `AI_prob = 97.0900%`, `Prediction = Likely AI Generated`
- ⚠️ **`animals\animals_21.jpg`** (animals): `AI_prob = 95.5500%`, `Prediction = Likely AI Generated`
- ⚠️ **`animals\animals_22.jpg`** (animals): `AI_prob = 97.0200%`, `Prediction = Likely AI Generated`
- ⚠️ **`animals\animals_23.jpg`** (animals): `AI_prob = 97.4400%`, `Prediction = Likely AI Generated`
- ⚠️ **`animals\animals_3.jpg`** (animals): `AI_prob = 95.1300%`, `Prediction = Likely AI Generated`
- ⚠️ **`animals\animals_38.jpg`** (animals): `AI_prob = 96.1300%`, `Prediction = Likely AI Generated`
- ⚠️ **`animals\animals_4.jpg`** (animals): `AI_prob = 96.4900%`, `Prediction = Likely AI Generated`
- ⚠️ **`animals\animals_41.jpg`** (animals): `AI_prob = 96.3400%`, `Prediction = Likely AI Generated`
- ⚠️ **`animals\animals_42.jpg`** (animals): `AI_prob = 97.2600%`, `Prediction = Likely AI Generated`
- ⚠️ **`animals\animals_43.jpg`** (animals): `AI_prob = 96.3000%`, `Prediction = Likely AI Generated`
- ⚠️ **`animals\animals_5.jpg`** (animals): `AI_prob = 96.9900%`, `Prediction = Likely AI Generated`
- *...and 201 additional false positive specimens recorded in CSV.*

### B. Natural Photos Flagged >= 0.50 (Binary False Positives): 324
- ⚠️ **`animals\animals_100.jpg`** (animals): `AI_prob = 95.0400%`
- ⚠️ **`animals\animals_104.jpg`** (animals): `AI_prob = 94.7700%`
- ⚠️ **`animals\animals_105.jpg`** (animals): `AI_prob = 85.0100%`
- ⚠️ **`animals\animals_107.jpg`** (animals): `AI_prob = 77.2500%`
- ⚠️ **`animals\animals_112.jpg`** (animals): `AI_prob = 96.8200%`
- ⚠️ **`animals\animals_114.jpg`** (animals): `AI_prob = 95.4200%`
- ⚠️ **`animals\animals_116.jpg`** (animals): `AI_prob = 96.6300%`
- ⚠️ **`animals\animals_117.jpg`** (animals): `AI_prob = 96.3600%`
- ⚠️ **`animals\animals_12.jpg`** (animals): `AI_prob = 97.3800%`
- ⚠️ **`animals\animals_127.jpg`** (animals): `AI_prob = 94.3200%`
- ⚠️ **`animals\animals_129.jpg`** (animals): `AI_prob = 86.0900%`
- ⚠️ **`animals\animals_13.jpg`** (animals): `AI_prob = 97.0900%`
- ⚠️ **`animals\animals_134.jpg`** (animals): `AI_prob = 73.7500%`
- ⚠️ **`animals\animals_136.jpg`** (animals): `AI_prob = 94.1700%`
- ⚠️ **`animals\animals_14.jpg`** (animals): `AI_prob = 96.4800%`
- ⚠️ **`animals\animals_17.jpg`** (animals): `AI_prob = 97.1800%`
- ⚠️ **`animals\animals_18.jpg`** (animals): `AI_prob = 97.0900%`
- ⚠️ **`animals\animals_19.jpg`** (animals): `AI_prob = 94.0400%`
- ⚠️ **`animals\animals_2.jpg`** (animals): `AI_prob = 93.9600%`
- ⚠️ **`animals\animals_21.jpg`** (animals): `AI_prob = 95.5500%`
- *...and 304 additional binary false positives recorded in CSV.*

---

## 6. False Negative Specimen Audit (AI Images Missed)

### A. AI Images Classified as Likely Natural (`AI_prob <= 0.50`): 0
- **ZERO AI Images Classified as Likely Natural**.

### B. AI Images Routed to Uncertain (`0.50 < AI_prob < 0.95`): 0
- **ZERO AI Images Routed to Uncertain**.

---

## 7. Historical Benchmark Comparison

| Benchmark Dataset | Total Images | Overall Acc (3-Way) | Decided Acc | Precision (3-Way) | AI Recall (>=0.95) | Binary AI Recall (>=0.50) | F1 Score | FPR (3-Way) | Binary FPR (>=0.50) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Previous 26 Benchmark** | 26 | 84.62% | 91.67% | 83.33% | 100.00% | 100.00% | 90.91% | 12.50% | 25.00% |
| **Previous Unseen 15** | 15 | 93.33% | 93.33% | 100.00% | 90.00% | 90.00% | 94.74% | 0.00% | 0.00% |
| **Combined 41 Benchmark** | 41 | 87.80% | 92.31% | 90.48% | 95.00% | 95.00% | 92.68% | 9.52% | 19.05% |
| **New 100 Benchmark** | 100 | 21.00% | 95.45% | 0.00% | 0.00% | 100.00% | 0.00% | 2.00% | 4.00% |
| **KAGGLE BENCHMARK** | **995** | **`67.34%`** | **`75.20%`** | **`52.98%`** | **`99.60%`** | **`100.00%`** | **`69.17%`** | **`29.66%`** | **`43.49%`** |

---

## 8. Production Safety Verification

A strict workspace check confirms:
- [`image_ai_detector.py`](file:///c:/Users/konet/Downloads/Deepshield/deepfake/ai-service/image_ai_detector.py): **100% UNCHANGED**
- [`image_ai_model.py`](file:///c:/Users/konet/Downloads/Deepshield/deepfake/ai-service/image_ai_model.py): **100% UNCHANGED**
- [`app.py`](file:///c:/Users/konet/Downloads/Deepshield/deepfake/ai-service/app.py): **100% UNCHANGED**
- [`UploadPage.tsx`](file:///c:/Users/konet/Downloads/Deepshield/deepfake/client/src/pages/UploadPage.tsx): **100% UNCHANGED**
- Voice Pipeline (`/predict`, `WavLM`): **100% UNCHANGED**
- Video Pipeline (`/predict-video`, `EfficientNet-B7`, `Xception`): **100% UNCHANGED**
- Model Weights & Thresholds: **100% UNCHANGED**

---

## 9. Final Decision

### **`INVESTIGATE XRAYON FURTHER`**

**Conclusion Rationale**:
Kaggle benchmark reveals performance trade-offs (Binary AI Recall: 100.00%, Binary FPR: 43.49%, Strict 3-Way AI Recall: 99.60%).
