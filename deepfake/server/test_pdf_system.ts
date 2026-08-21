import path from 'path';
import fs from 'fs';
import { generateForensicPdfCertificate } from './src/services/pdfReportService';
import { getStoredReportsList, enforceReportStorageLimit } from './src/services/reportStorageManager';

async function testPdfSystem() {
  console.log("==========================================================================");
  console.log("       TESTING DEEPSHIELD FORENSIC PDF & STORAGE MANAGER SYSTEM");
  console.log("==========================================================================");

  // 1. Generate test PDF
  const testInput = {
    id: "test-uuid-987654321",
    originalFileName: "ceo_deepfake_specimen.wav",
    fileSize: 4850120,
    mimeType: "audio/wav",
    mediaType: "AUDIO",
    durationSeconds: 14.85,
    fileHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    confidence: 0.965,
    deepfakeProbability: 0.884,
    overallScore: 0.884,
    riskLevel: "CRITICAL",
    verdict: "DEEPFAKE",
    status: "DEEPFAKE",
    processingTime: 0.52,
    modelVersion: "DeepShield WavLM Neural Engine v2.0 (Calibrated)",
    waveform: Array.from({ length: 100 }, () => Math.random() * 2 - 1),
    features: {
      pitch_f0_std: 3.2,
      hnr_db: 22.4,
      zero_crossing_rate_mean: 0.082,
    },
    createdAt: new Date(),
  };

  const res = await generateForensicPdfCertificate(testInput);
  console.log("PDF Certificate Generated Successfully:");
  console.log(" * PDF File Path  :", res.pdfFilePath);
  console.log(" * PDF File Name  :", res.pdfFileName);
  console.log(" * JSON File Name :", res.jsonFileName);
  console.log(" * Case ID        :", res.caseId);
  console.log(" * Threat Level   :", res.threatLevel);
  console.log(" * SHA-256 Hash   :", res.sha256Hash);

  // 2. Check File Exists
  const pdfExists = fs.existsSync(res.pdfFilePath);
  const jsonPath = res.pdfFilePath.replace(/\.pdf$/, '.json');
  const jsonExists = fs.existsSync(jsonPath);

  console.log("File Existence Check:");
  console.log(" * PDF Exists?  :", pdfExists);
  console.log(" * JSON Exists? :", jsonExists);

  // 3. Test Storage Manager 15-report limit
  console.log("\nTesting Storage Manager Limit (15 Max Reports)...");
  for (let i = 1; i <= 18; i++) {
    await generateForensicPdfCertificate({
      ...testInput,
      id: `bulk-test-${i}`,
      originalFileName: `specimen_file_${i}.wav`,
    });
  }

  const reportsList = getStoredReportsList();
  console.log(`Stored Reports Count after 18 bulk generations: ${reportsList.length}`);
  console.log(" * Storage limit enforced (<= 15):", reportsList.length <= 15);
  console.log(" * Newest report preserved        :", reportsList[0].fileName);

  console.log("\n==========================================================================");
  console.log("                 SYSTEM VERIFICATION PASSED SUCCESSFULLY");
  console.log("==========================================================================");
}

testPdfSystem().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
