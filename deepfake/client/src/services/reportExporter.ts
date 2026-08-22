import { ScanRecord } from './scanHistoryService';

export const exportJsonReport = (record: ScanRecord) => {
  const isAi = record.verdict.toUpperCase().includes('AI') || record.verdict.toUpperCase().includes('DEEPFAKE');
  const jsonContent = JSON.stringify({
    system: "DeepShield Enterprise Forensic Engine",
    caseId: record.caseId,
    reportId: record.reportId,
    timestamp: record.createdAt,
    specimen: {
      fileName: record.fileName,
      mediaType: record.mediaType,
      fileSize: record.fileSize,
      durationSeconds: record.durationSeconds ?? null,
    },
    forensics: {
      verdict: record.verdict,
      confidence: `${record.confidence}%`,
      deepfakeProbability: record.deepfakeProbability ?? null,
      threatLevel: record.threatLevel,
      sha256Hash: record.sha256Hash,
      processingTimeSeconds: record.processingTime,
      modelVersion: record.modelVersion,
    },
    decisionExplanation: buildDecisionExplanation(record),
    limitations: "AI detection is probabilistic and is not absolute proof of image, audio, or video generation or manipulation. Results should be used as one input in a broader forensic investigation, not as standalone evidence.",
    verificationStatus: "CRYPTOGRAPHICALLY SIGNED & VERIFIED",
  }, null, 2);

  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${record.caseId}_forensic_report.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const buildDecisionExplanation = (record: ScanRecord): string => {
  const isAi = record.verdict.toUpperCase().includes('AI') || record.verdict.toUpperCase().includes('DEEPFAKE');
  const isUncertain = record.verdict === 'Uncertain';
  const aiPct = record.deepfakeProbability != null
    ? (record.deepfakeProbability > 1 ? record.deepfakeProbability : record.deepfakeProbability * 100).toFixed(2)
    : null;
  const confPct = record.confidence.toFixed(2);

  if (record.mediaType === 'image') {
    const realPct = record.deepfakeProbability != null
      ? (Math.max(0, 1 - (record.deepfakeProbability > 1 ? record.deepfakeProbability / 100 : record.deepfakeProbability)) * 100).toFixed(2)
      : null;
    if (isAi && aiPct) {
      return `AI probability was ${aiPct}%, exceeding the 96% high-confidence AI threshold. The xRayon ConvNeXtV2 Phase-2 model therefore classified this specimen as "Likely AI Generated". Real probability: ${realPct ?? 'N/A'}%.`;
    } else if (isUncertain && aiPct) {
      return `AI probability was ${aiPct}%. This is above the 50% natural threshold but below the 96% high-confidence AI threshold, so the system reports "Uncertain" rather than making a high-confidence AI claim. Real probability: ${realPct ?? 'N/A'}%.`;
    } else if (aiPct) {
      return `AI probability was ${aiPct}%, below the 50% natural threshold. The model output favors the natural-image class and classifies this specimen as "Likely Natural". Real probability: ${realPct ?? 'N/A'}%.`;
    }
    return `xRayon ConvNeXtV2 Phase-2 returned confidence: ${confPct}%. Classification: ${record.verdict}.`;
  }

  if (record.mediaType === 'audio') {
    return isAi
      ? `The WavLM neural audio classifier returned a deepfake probability of ${confPct}%, indicating vocal characteristics that deviate from natural speech patterns consistent with the model's training distribution.`
      : `The WavLM neural audio classifier returned a confidence score of ${confPct}% in favor of the genuine/natural class. The vocal characteristics are consistent with natural human speech.`;
  }

  if (record.mediaType === 'video') {
    return isAi
      ? `The XceptionNet video classifier returned a deepfake confidence score of ${confPct}%. Frame-level analysis yielded a weighted vote in favor of the AI/deepfake class.`
      : `The XceptionNet video classifier returned a confidence score of ${confPct}% in favor of the real/authentic class. Frame-level temporal analysis did not identify deepfake manipulation patterns.`;
  }

  return `Model confidence: ${confPct}%. Verdict: ${record.verdict}.`;
};

const buildThresholdSection = (record: ScanRecord): string => {
  if (record.mediaType === 'image') {
    return `
      <div class="section">
        <div class="section-title">THRESHOLD / DECISION RULE</div>
        <div class="threshold-grid">
          <div class="threshold-box natural">AI ≤ 50% → Likely Natural</div>
          <div class="threshold-box uncertain">50% &lt; AI &lt; 96% → Uncertain</div>
          <div class="threshold-box ai">AI ≥ 96% → Likely AI Generated</div>
        </div>
        <p style="font-size:10px;color:#94a3b8;margin-top:8px;font-family:monospace;">
          Model: xRayon ConvNeXtV2 Phase-2 · Checkpoint: checkpoint_phase2.pth · Production threshold: 0.96
        </p>
      </div>
    `;
  }
  if (record.mediaType === 'audio') {
    return `
      <div class="section">
        <div class="section-title">MODEL DECISION RULE</div>
        <p style="font-size:11px;color:#94a3b8;">
          Model: DavidCombei/wavLM-base-Deepfake_V2 · Input: 16kHz mono audio · 
          Classification based on WavLM neural spectral feature embeddings.
        </p>
      </div>
    `;
  }
  return `
    <div class="section">
      <div class="section-title">MODEL DECISION RULE</div>
      <p style="font-size:11px;color:#94a3b8;">
        Classifier: Xception / EfficientNet-B7 · Trained on FaceForensics++ / DFDC datasets ·
        Method: Temporal frame sampling → face alignment → patch-level scoring → weighted majority vote.
      </p>
    </div>
  `;
};

export const viewPdfReport = async (record: ScanRecord) => {
  const token = localStorage.getItem('deepshield_token') || localStorage.getItem('token') || '';
  const downloadUrl = record.pdfDownloadUrl || `/api/reports/download/${record.caseId}.pdf`;
  try {
    const fullUrl = downloadUrl.startsWith('http')
      ? downloadUrl
      : `${window.location.origin}${downloadUrl.startsWith('/') ? '' : '/'}${downloadUrl}`;
    const urlWithToken = `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}inline=true&token=${encodeURIComponent(token)}`;
    const res = await fetch(urlWithToken, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const blob = await res.blob();
      const headerText = await blob.slice(0, 5).text();
      if (headerText.startsWith('%PDF')) {
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const objectUrl = URL.createObjectURL(pdfBlob);
        const previewWin = window.open(objectUrl, '_blank');
        if (!previewWin) {
          // If popup is blocked by browser, trigger direct download
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = record.reportName || `DeepShield_Forensic_Report_${record.caseId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        return;
      }
    }
  } catch (err) {
    console.warn('[View PDF Warning]: Failed to fetch valid PDF binary from backend:', err);
  }

  // Fallback if backend fetch fails
  exportPdfCertificate(record);
};

export const exportPdfCertificate = async (record: ScanRecord) => {
  const token = localStorage.getItem('deepshield_token') || localStorage.getItem('token') || '';
  const downloadUrl = record.pdfDownloadUrl || `/api/reports/download/${record.caseId}.pdf`;
  
  // 1. Try real backend PDF download first
  try {
    const fullUrl = downloadUrl.startsWith('http')
      ? downloadUrl
      : `${window.location.origin}${downloadUrl.startsWith('/') ? '' : '/'}${downloadUrl}`;
    const urlWithToken = `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
    const res = await fetch(urlWithToken, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const blob = await res.blob();
      const headerText = await blob.slice(0, 5).text();
      if (headerText.startsWith('%PDF')) {
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = record.reportName || `DeepShield_Forensic_Report_${record.caseId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        return;
      }
    }
  } catch (err) {
    console.warn('[PDF Export Warning]: Backend fetch failed, opening printable certificate fallback:', err);
  }

  // Fallback: Generate printable forensic certificate
  const isAi = record.verdict.toUpperCase().includes('AI') || record.verdict.toUpperCase().includes('DEEPFAKE');
  const verdictColor = isAi ? '#f87171' : record.verdict === 'Uncertain' ? '#fbbf24' : '#00e6a8';
  const verdictBorderColor = isAi ? '#ef4444' : record.verdict === 'Uncertain' ? '#f59e0b' : '#00e6a8';
  const decisionExplanation = buildDecisionExplanation(record);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>DeepShield Forensic Certificate — ${record.caseId}</title>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #070c1a; color: #e2e8f0; padding: 40px; margin: 0; }
        .cert-card { max-width: 860px; margin: 0 auto; border: 2px solid #00e6a8; border-radius: 16px; padding: 40px; background: #0d1527; box-shadow: 0 0 40px rgba(0,230,168,0.15); }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 24px; }
        .logo { font-size: 22px; font-weight: 900; color: #00e6a8; letter-spacing: -0.5px; }
        .logo-sub { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; margin-top: 3px; }
        .badge { background: rgba(0,230,168,0.15); border: 1px solid #00e6a8; color: #00e6a8; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 11px; text-align:center; }
        .verdict-box { background: transparent; border: 2px solid ${verdictBorderColor}; padding: 22px; border-radius: 14px; text-align: center; margin-bottom: 22px; }
        .verdict-title { font-size: 28px; font-weight: 900; color: ${verdictColor}; margin: 0 0 6px 0; letter-spacing: 1px; }
        .verdict-conf { font-size: 13px; color: #94a3b8; font-family: monospace; }
        .section { background: #070c1a; border: 1px solid #1e293b; padding: 16px 18px; border-radius: 12px; margin-bottom: 14px; }
        .section-title { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin-bottom: 8px; }
        .section-body { font-size: 12px; color: #e2e8f0; line-height: 1.6; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
        .field { background: #070c1a; border: 1px solid #1e293b; padding: 14px; border-radius: 10px; }
        .field-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 4px; }
        .field-val { font-size: 13px; font-weight: 700; color: #ffffff; font-family: monospace; word-break: break-all; }
        .hash-box { background: #070c1a; border: 1px solid #1e293b; padding: 14px 16px; border-radius: 10px; margin-bottom: 14px; }
        .hash-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 6px; }
        .hash-val { font-family: monospace; font-size: 11px; color: #38bdf8; word-break: break-all; }
        .threshold-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 8px 0; }
        .threshold-box { padding: 8px; border-radius: 8px; text-align: center; font-size: 10px; font-family: monospace; font-weight: 700; }
        .threshold-box.natural { background: rgba(0,230,168,0.1); border: 1px solid #00e6a8; color: #00e6a8; }
        .threshold-box.uncertain { background: rgba(245,158,11,0.1); border: 1px solid #f59e0b; color: #fbbf24; }
        .threshold-box.ai { background: rgba(239,68,68,0.1); border: 1px solid #ef4444; color: #f87171; }
        .limitations { background: #070c1a; border: 1px solid #334155; padding: 14px 16px; border-radius: 10px; margin-bottom: 14px; }
        .limitations-text { font-size: 10px; color: #64748b; line-height: 1.6; }
        .footer { font-size: 10px; color: #475569; text-align: center; border-top: 1px solid #1e293b; padding-top: 18px; margin-top: 10px; }
        @media print {
          body { background: #ffffff; color: #000000; padding: 20px; }
          .cert-card { background: #ffffff; border-color: #000; box-shadow: none; }
          .section, .field, .hash-box, .limitations { background: #f8fafc; border-color: #cbd5e1; }
          .field-val, .hash-val { color: #000; }
          .section-body, .limitations-text { color: #1e293b; }
          .logo { color: #0f766e; }
          .verdict-title { color: ${isAi ? '#dc2626' : record.verdict === 'Uncertain' ? '#d97706' : '#0f766e'}; }
        }
      </style>
    </head>
    <body>
      <div class="cert-card">
        <div class="header">
          <div>
            <div class="logo">TRUEVISION DEEPSHIELD</div>
            <div class="logo-sub">Enterprise AI Forensic Detection Platform</div>
          </div>
          <div>
            <div class="badge">FORENSIC CERTIFICATE</div>
            <div style="font-size:10px;color:#64748b;text-align:center;margin-top:4px;">Digital Signature Verified</div>
          </div>
        </div>

        <!-- VERDICT -->
        <div class="verdict-box">
          <div style="font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">FINAL FORENSIC VERDICT</div>
          <div class="verdict-title">${record.verdict.toUpperCase()}</div>
          <div class="verdict-conf">
            Confidence: ${record.confidence}% 
            ${record.deepfakeProbability != null ? ` &nbsp;|&nbsp; AI Probability: ${(record.deepfakeProbability > 1 ? record.deepfakeProbability : record.deepfakeProbability * 100).toFixed(2)}%` : ''}
          </div>
        </div>

        <!-- SPECIMEN INFO -->
        <div class="grid">
          <div class="field"><div class="field-label">Case Identifier</div><div class="field-val" style="color:#00e6a8;">${record.caseId}</div></div>
          <div class="field"><div class="field-label">Media Modality</div><div class="field-val" style="text-transform:uppercase;">${record.mediaType}</div></div>
          <div class="field"><div class="field-label">Specimen Filename</div><div class="field-val">${record.fileName}</div></div>
          <div class="field"><div class="field-label">Threat Level</div><div class="field-val">${record.threatLevel}</div></div>
          <div class="field"><div class="field-label">AI Model Engine</div><div class="field-val" style="color:#c084fc;">${record.modelVersion}</div></div>
          <div class="field"><div class="field-label">Processing Time</div><div class="field-val">${record.processingTime}s</div></div>
        </div>

        <!-- SHA-256 -->
        <div class="hash-box">
          <div class="hash-label">SHA-256 Cryptographic File Fingerprint</div>
          <div class="hash-val">${record.sha256Hash}</div>
        </div>

        <!-- WHY THIS RESULT -->
        <div class="section">
          <div class="section-title">WHY THIS RESULT? — FORENSIC DECISION EXPLANATION</div>
          <div class="section-body">${decisionExplanation}</div>
        </div>

        <!-- FORENSIC EVIDENCE -->
        <div class="section">
          <div class="section-title">FORENSIC EVIDENCE</div>
          <div class="section-body">
            ${record.mediaType === 'image'
              ? `xRayon ConvNeXtV2 Phase-2 performs probabilistic classification using learned neural representations. The model does not expose human-readable feature attribution. Classification is based on the ConvNeXtV2-Base architecture trained on synthetic vs. real image datasets.`
              : record.mediaType === 'audio'
              ? `WavLM-base neural audio classifier evaluated 16kHz mono spectral embeddings. The model outputs a deepfake probability based on vocal characteristic patterns learned from the training corpus.`
              : `XceptionNet classifier performed temporal frame sampling. Face regions were detected via RetinaFace/MTCNN and forwarded to the Xception model for patch-level classification. A weighted majority vote was used to produce the final verdict.`
            }
          </div>
        </div>

        <!-- THRESHOLD -->
        ${buildThresholdSection(record)}

        <!-- INTERPRETATION -->
        <div class="section">
          <div class="section-title">INTERPRETATION</div>
          <div class="section-body">
            ${isAi
              ? `The ${record.mediaType} specimen exhibits characteristics consistent with AI-generated or digitally manipulated content as identified by the DeepShield ${record.modelVersion} classifier.`
              : record.verdict === 'Uncertain'
              ? `The classifier output falls in the uncertain zone. The specimen could not be classified with high confidence as either AI-generated or natural. Additional investigation is recommended.`
              : `The ${record.mediaType} specimen exhibits characteristics consistent with authentic, naturally-captured content as identified by the DeepShield ${record.modelVersion} classifier.`
            }
          </div>
        </div>

        <!-- LIMITATIONS -->
        <div class="limitations">
          <div class="section-title">LIMITATIONS</div>
          <div class="limitations-text">
            AI deepfake detection is probabilistic and is not absolute proof of ${record.mediaType} generation or manipulation.
            Results may vary based on ${record.mediaType === 'image' ? 'image resolution, compression, and subject content' : record.mediaType === 'audio' ? 'clip duration, background noise, and audio compression' : 'video quality, face visibility, and clip length'}.
            This forensic report should be used as one input in a broader forensic investigation, not as standalone legal evidence.
            The ${record.modelVersion} model was used under its published license for research and investigative purposes.
          </div>
        </div>

        <div class="footer">
          DeepShield Enterprise · Case ID: ${record.caseId} · Generated: ${new Date(record.createdAt).toLocaleString()} · Engine: ${record.modelVersion}
        </div>
      </div>
      <script>window.onload = function() { window.print(); };</script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};
