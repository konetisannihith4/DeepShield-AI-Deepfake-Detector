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

const getStorageKey = (userId?: string): string => {
  return userId ? `deepshield_scan_history_${userId}` : 'deepshield_scan_history_guest';
};

/**
 * Get user-scoped local scan history (defaults to empty array [] for new users)
 */
export const getLocalScanHistory = (userId?: string): ScanRecord[] => {
  try {
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed: ScanRecord[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
};

/**
 * Save scan record scoped to specific authenticated user
 */
export const saveScanToHistory = (record: Partial<ScanRecord>, userId?: string): ScanRecord => {
  const history = getLocalScanHistory(userId);
  const key = getStorageKey(userId);

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

  // Filter out duplicate caseId or sha256Hash for this user
  const filtered = history.filter((item) => item.caseId !== newRecord.caseId && item.sha256Hash !== newRecord.sha256Hash);
  filtered.unshift(newRecord);

  try {
    localStorage.setItem(key, JSON.stringify(filtered.slice(0, 100)));
    window.dispatchEvent(new Event('scanCompleted'));
  } catch (err) {
    console.error('[ScanHistoryService Error]:', err);
  }

  return newRecord;
};

/**
 * Clear cached history for a user upon logout
 */
export const clearUserScanHistory = (userId?: string): void => {
  try {
    if (userId) {
      localStorage.removeItem(`deepshield_scan_history_${userId}`);
    }
    localStorage.removeItem('deepshield_scan_history_guest');
    localStorage.removeItem('deepshield_scan_history'); // Clean up old legacy global key
  } catch (err) {
    console.error('[ScanHistoryService Clear Error]:', err);
  }
};
