export interface ScanRecord {
  caseId: string;
  reportId: string;
  reportName: string;
  fileName: string;
  mediaType: 'image' | 'video' | 'audio';
  durationSeconds?: number;
  verdict: string;
  confidence: number;
  deepfakeProbability?: number;
  threatLevel: 'LOW' | 'MODERATE' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  fileSize: number;
  sha256Hash: string;
  processingTime: number;
  modelVersion: string;
  pdfDownloadUrl: string;
  jsonDownloadUrl: string;
  isDuplicate?: boolean;
  duplicateCaseId?: string;
}

const STORAGE_KEY = 'deepshield_scan_history';

// Default seed records so the archive is never empty on clean launch
const SEED_RECORDS: ScanRecord[] = [
  {
    caseId: 'CASE-IMG-994821',
    reportId: 'REP-IMG-994821',
    reportName: 'DS_CASE-IMG-994821.pdf',
    fileName: 'ai_boy_portrait2.png',
    mediaType: 'image',
    verdict: 'Likely AI Generated',
    confidence: 97.46,
    deepfakeProbability: 0.9746,
    threatLevel: 'HIGH',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    fileSize: 1435600,
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    processingTime: 0.38,
    modelVersion: 'xRayon-ConvNeXtV2-Phase2',
    pdfDownloadUrl: '/api/reports/download/report.pdf',
    jsonDownloadUrl: '/api/reports/download/report.json'
  },
  {
    caseId: 'CASE-IMG-882194',
    reportId: 'REP-IMG-882194',
    reportName: 'DS_CASE-IMG-882194.pdf',
    fileName: 'real_camera_person.jpg',
    mediaType: 'image',
    verdict: 'Likely Natural',
    confidence: 96.90,
    deepfakeProbability: 0.0310,
    threatLevel: 'LOW',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    fileSize: 842100,
    sha256Hash: '7a842b104927f83e20149acb1094f8e329188a1094857d0e9182d7394b194029',
    processingTime: 0.42,
    modelVersion: 'xRayon-ConvNeXtV2-Phase2',
    pdfDownloadUrl: '/api/reports/download/report.pdf',
    jsonDownloadUrl: '/api/reports/download/report.json'
  },
  {
    caseId: 'CASE-VID-774012',
    reportId: 'REP-VID-774012',
    reportName: 'DS_CASE-VID-774012.pdf',
    fileName: 'dfdc_face_swap_specimen.mp4',
    mediaType: 'video',
    durationSeconds: 12.5,
    verdict: 'AI GENERATED VIDEO',
    confidence: 98.20,
    deepfakeProbability: 0.9820,
    threatLevel: 'CRITICAL',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    fileSize: 18450000,
    sha256Hash: 'f482a90184b29f0e194857104928b104958d0194857b019485d019485d910485',
    processingTime: 3.84,
    modelVersion: 'Xception / EfficientNet Video Classifier',
    pdfDownloadUrl: '/api/reports/download/report.pdf',
    jsonDownloadUrl: '/api/reports/download/report.json'
  },
  {
    caseId: 'CASE-AUD-552190',
    reportId: 'REP-AUD-552190',
    reportName: 'DS_CASE-AUD-552190.pdf',
    fileName: 'ceo_voice_call_verification.wav',
    mediaType: 'audio',
    durationSeconds: 7.7,
    verdict: 'AI GENERATED VOICE',
    confidence: 94.00,
    deepfakeProbability: 0.9400,
    threatLevel: 'HIGH',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    fileSize: 2450000,
    sha256Hash: '826112549429f732d1383a99e28387dd29ef8acd95cea3daa935e573231e6cf2',
    processingTime: 1.48,
    modelVersion: 'DavidCombei/wavLM-base-Deepfake_V2',
    pdfDownloadUrl: '/api/reports/download/report.pdf',
    jsonDownloadUrl: '/api/reports/download/report.json'
  }
];

export const getLocalScanHistory = (): ScanRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_RECORDS));
      return SEED_RECORDS;
    }
    const parsed: ScanRecord[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_RECORDS));
      return SEED_RECORDS;
    }
    return parsed;
  } catch {
    return SEED_RECORDS;
  }
};

export const saveScanToHistory = (record: Partial<ScanRecord>): ScanRecord => {
  const history = getLocalScanHistory();
  
  const caseId = record.caseId || `CASE-${Date.now().toString().slice(-6)}`;
  const sha256Hash = record.sha256Hash || `hash_${Date.now()}`;
  
  const newRecord: ScanRecord = {
    caseId: caseId,
    reportId: record.reportId || `REP-${Date.now()}`,
    reportName: record.reportName || `DS_${caseId}.pdf`,
    fileName: record.fileName || 'specimen.jpg',
    mediaType: record.mediaType || 'image',
    durationSeconds: record.durationSeconds,
    verdict: record.verdict || 'Likely AI Generated',
    confidence: record.confidence ?? 95.0,
    deepfakeProbability: record.deepfakeProbability ?? 0.95,
    threatLevel: record.threatLevel || (record.verdict?.includes('AI') ? 'HIGH' : 'LOW'),
    createdAt: record.createdAt || new Date().toISOString(),
    fileSize: record.fileSize || 500000,
    sha256Hash: sha256Hash,
    processingTime: record.processingTime || 0.42,
    modelVersion: record.modelVersion || 'xRayon-ConvNeXtV2-Phase2',
    pdfDownloadUrl: record.pdfDownloadUrl || `/api/reports/download/report.pdf`,
    jsonDownloadUrl: record.jsonDownloadUrl || `/api/reports/download/report.json`,
  };

  // Filter out any duplicate caseId or sha256Hash
  const filtered = history.filter(item => item.caseId !== newRecord.caseId && item.sha256Hash !== newRecord.sha256Hash);
  filtered.unshift(newRecord);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 100)));
    window.dispatchEvent(new Event('scanCompleted'));
  } catch (err) {
    console.error('[ScanHistoryService Error]:', err);
  }

  return newRecord;
};
