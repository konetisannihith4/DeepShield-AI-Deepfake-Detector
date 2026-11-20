import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler';

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

export interface ExtractedMediaResult {
  audioBuffer: Buffer;
  durationSeconds: number;
  isVideo: boolean;
  format: string;
  fileHash: string;
  originalFileName: string;
  storedFileName: string;
  videoUrl?: string;
  audioUrl?: string;
  sampleRate: number;
  channels: number;
  processingTimeMs: number;
}

export class MediaProcessor {
  public static readonly ALLOWED_MIME_TYPES = new Set([
    // Audio
    'audio/wav',
    'audio/x-wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/aac',
    'audio/flac',
    'audio/x-flac',
    'audio/ogg',
    'audio/x-m4a',
    'audio/mp4',
    'audio/m4a',
    // Video
    'video/mp4',
    'video/x-msvideo',
    'video/avi',
    'video/quicktime',
    'video/x-matroska',
    'video/mkv',
    'video/webm',
    // Image
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ]);

  public static readonly ALLOWED_EXTENSIONS = new Set([
    '.wav', '.mp3', '.aac', '.flac', '.ogg', '.m4a',
    '.mp4', '.avi', '.mov', '.mkv', '.webm',
    '.jpg', '.jpeg', '.png', '.webp', '.gif'
  ]);

  /**
   * Validates whether a file has supported media extension or MIME type.
   */
  public static isValidMedia(mimeType: string, filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    if (this.ALLOWED_EXTENSIONS.has(ext)) return true;
    if (this.ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) return true;
    if (mimeType.startsWith('audio/') || mimeType.startsWith('video/') || mimeType.startsWith('image/')) return true;
    return false;
  }

  /**
   * Validates Magic Bytes file signature to reject executables / corrupted files.
   */
  public static validateMagicBytes(buffer: Buffer, filename: string): void {
    if (!buffer || buffer.length < 4) {
      throw new AppError('Corrupted or empty media file specimen uploaded.', 400);
    }

    const hex = buffer.subarray(0, 8).toString('hex').toUpperCase();

    // Check Executable Magic Bytes (DOS / PE / ELF / Mach-O)
    if (hex.startsWith('4D5A') || hex.startsWith('7F454C46') || hex.startsWith('FEEDFACE') || hex.startsWith('CEFAEDFE')) {
      throw new AppError('Security Violation: Executable file upload detected and rejected.', 400);
    }
  }

  /**
   * Real FFmpeg Audio Track Extraction, Speech Presence Verification, and File Storage.
   */
  public static async extractAudioTrack(
    fileBuffer: Buffer,
    mimeType: string,
    originalName: string
  ): Promise<ExtractedMediaResult> {
    const startTime = Date.now();
    this.validateMagicBytes(fileBuffer, originalName);

    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const ext = path.extname(originalName).toLowerCase() || '.mp4';
    const isVideo = mimeType.startsWith('video/') || ['.mp4', '.avi', '.mov', '.mkv', '.webm'].includes(ext);

    console.log(`[MediaProcessor]: Processing ${isVideo ? 'VIDEO' : 'AUDIO'} specimen (${originalName}, hash: ${fileHash.slice(0, 8)})...`);

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepshield-ff-'));
    const inputPath = path.join(tempDir, `input_${Date.now()}${ext}`);
    const outputPath = path.join(tempDir, `extracted_${Date.now()}.wav`);

    try {
      fs.writeFileSync(inputPath, fileBuffer);

      // Extract 16kHz mono WAV audio stream using FFmpeg
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .outputOptions([
            '-vn',                 // Disable video
            '-map 0:a:0?',         // Select first audio stream if present
            '-acodec pcm_s16le',   // 16-bit PCM WAV
            '-ar 16000',           // 16kHz
            '-ac 1',               // Mono
          ])
          .toFormat('wav')
          .on('start', (cmd) => console.log('[MediaProcessor]: Executing FFmpeg command:', cmd))
          .on('end', () => resolve())
          .on('error', (err) => {
            if (isVideo) {
              console.error('[MediaProcessor]: FFmpeg extraction failed for video specimen:', err.message);
            }
            reject(err);
          })
          .save(outputPath);
      });

      // 1. Audio Track Presence Check for Video Specimens
      if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 100) {
        if (isVideo) {
          throw new AppError('No audio track found in the uploaded video.', 400);
        }
        throw new AppError('Failed to extract valid audio stream from uploaded media.', 400);
      }

      const audioBuffer = fs.readFileSync(outputPath);

      // Find PCM Data Chunk Offset in WAV Buffer
      const dataOffset = audioBuffer.indexOf('data');
      const pcmStart = dataOffset !== -1 ? dataOffset + 8 : 44;
      const pcmBytes = Math.max(0, audioBuffer.length - pcmStart);
      const durationSeconds = Math.round((pcmBytes / 32000) * 10) / 10;

      // 2. Minimum Duration Check (< 1.0 second)
      if (durationSeconds < 1.0 || pcmBytes < 32000) {
        throw new AppError('No speech detected in the uploaded media. Please upload audio or video containing speech.', 400);
      }

      // 3. Speech Presence & Non-Silence Verification
      const numSamples = Math.floor(pcmBytes / 2);
      let sumSq = 0;
      let peak = 0;

      for (let i = 0; i < numSamples; i++) {
        const sample = Math.abs(audioBuffer.readInt16LE(pcmStart + i * 2) / 32768.0);
        if (sample > peak) peak = sample;
        sumSq += sample * sample;
      }
      const rms = Math.sqrt(sumSq / Math.max(1, numSamples));

      // Reject silent audio or non-speech background static (Peak amplitude < 0.015 or RMS energy < 0.003)
      if (peak < 0.015 || rms < 0.003) {
        throw new AppError('No speech detected in the uploaded media. Please upload audio or video containing speech.', 400);
      }

      // Store files in static uploads directory
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const uuidPrefix = crypto.randomUUID();
      const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storedFileName = `${uuidPrefix}-${sanitizedName}`;
      const storedFilePath = path.join(uploadsDir, storedFileName);

      fs.writeFileSync(storedFilePath, fileBuffer);

      const extractedFileName = `${uuidPrefix}-extracted.wav`;
      const extractedFilePath = path.join(uploadsDir, extractedFileName);
      fs.writeFileSync(extractedFilePath, audioBuffer);

      const processingTimeMs = Date.now() - startTime;

      return {
        audioBuffer,
        durationSeconds,
        isVideo,
        format: ext.replace('.', '').toUpperCase(),
        fileHash,
        originalFileName: originalName,
        storedFileName,
        videoUrl: isVideo ? `/uploads/${storedFileName}` : undefined,
        audioUrl: isVideo ? `/uploads/${extractedFileName}` : `/uploads/${storedFileName}`,
        sampleRate: 16000,
        channels: 1,
        processingTimeMs,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      if (isVideo) {
        throw new AppError('No audio track found in the uploaded video.', 400);
      }
      throw new AppError(err.message || 'Media processing failed', 400);
    } finally {
      // Clean up temporary extraction files
      try {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
        console.log('[MediaProcessor]: Cleaned up temporary extraction files.');
      } catch (cleanupErr: any) {
        console.warn('[MediaProcessor]: Cleanup warning:', cleanupErr.message);
      }
    }
  }
}
