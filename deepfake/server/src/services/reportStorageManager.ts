import fs from 'fs';
import path from 'path';

export const REPORTS_DIR = path.resolve(__dirname, '../../reports');

export function ensureReportsDirectoryExists(): string {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  return REPORTS_DIR;
}

export interface StoredReportFileInfo {
  fileName: string;
  filePath: string;
  birthtime: Date;
  size: number;
}

export function getStoredReportsList(): StoredReportFileInfo[] {
  ensureReportsDirectoryExists();
  const files = fs.readdirSync(REPORTS_DIR);
  
  const reportFiles: StoredReportFileInfo[] = [];

  for (const file of files) {
    if (file.endsWith('.pdf')) {
      const fullPath = path.join(REPORTS_DIR, file);
      try {
        const stats = fs.statSync(fullPath);
        reportFiles.push({
          fileName: file,
          filePath: fullPath,
          birthtime: stats.birthtime || stats.mtime,
          size: stats.size,
        });
      } catch (err) {
        console.warn(`[ReportStorageManager]: Failed to stat file ${file}`, err);
      }
    }
  }

  // Sort newest first
  reportFiles.sort((a, b) => b.birthtime.getTime() - a.birthtime.getTime());
  return reportFiles;
}

export function enforceReportStorageLimit(maxReports: number = 15): StoredReportFileInfo[] {
  const reports = getStoredReportsList();
  
  if (reports.length > maxReports) {
    // Keep newest maxReports, delete oldest
    const reportsToKeep = reports.slice(0, maxReports);
    const reportsToDelete = reports.slice(maxReports);

    for (const report of reportsToDelete) {
      try {
        if (fs.existsSync(report.filePath)) {
          fs.unlinkSync(report.filePath);
          console.log(`[ReportStorageManager]: Auto-deleted old report exceeding ${maxReports} limit -> ${report.fileName}`);
        }
        
        // Also delete matching JSON file if it exists
        const jsonPath = report.filePath.replace(/\.pdf$/, '.json');
        if (fs.existsSync(jsonPath)) {
          fs.unlinkSync(jsonPath);
        }
      } catch (err) {
        console.error(`[ReportStorageManager]: Error deleting old report file ${report.fileName}`, err);
      }
    }

    return reportsToKeep;
  }

  return reports;
}
