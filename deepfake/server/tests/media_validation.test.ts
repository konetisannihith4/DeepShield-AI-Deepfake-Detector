import { MediaProcessor } from '../src/services/mediaProcessor';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

// 1. Helper to create MP4 video WITHOUT audio track
async function createVideoWithoutAudio(): Promise<Buffer> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-no-audio-'));
  const mp4Path = path.join(tempDir, 'no_audio.mp4');

  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input('color=c=red:s=320x240:d=2')
      .inputOptions(['-f lavfi'])
      .outputOptions(['-c:v libx264', '-an', '-pix_fmt yuv420p'])
      .save(mp4Path)
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });

  const buf = fs.readFileSync(mp4Path);
  try {
    fs.unlinkSync(mp4Path);
    fs.rmdirSync(tempDir);
  } catch {}
  return buf;
}

// 2. Helper to create silent WAV buffer (RMS energy ~ 0)
function createSilentWavBuffer(durationSec: number = 3.0): Buffer {
  const sampleRate = 16000;
  const numSamples = Math.floor(sampleRate * durationSec);
  const headerSize = 44;
  const pcmDataSize = numSamples * 2;
  const buffer = Buffer.alloc(headerSize + pcmDataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + pcmDataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(pcmDataSize, 40);

  // Leave pcmData as zero bytes (Silence)
  return buffer;
}

// 3. Helper to create short WAV buffer (< 1.0 second)
function createShortWavBuffer(durationSec: number = 0.5): Buffer {
  const sampleRate = 16000;
  const numSamples = Math.floor(sampleRate * durationSec);
  const headerSize = 44;
  const pcmDataSize = numSamples * 2;
  const buffer = Buffer.alloc(headerSize + pcmDataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + pcmDataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(pcmDataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const val = 0.5 * Math.sin(2 * Math.PI * 440 * (i / sampleRate));
    buffer.writeInt16LE(Math.floor(val * 16000), headerSize + i * 2);
  }
  return buffer;
}

async function runValidationTests() {
  console.log("==========================================================================");
  console.log("🧪 AUTOMATED SUITE: MEDIA VALIDATION & SPEECH SANITY TESTS");
  console.log("==========================================================================");

  let passedTests = 0;
  let totalTests = 4;

  // TEST 1: Video Without Audio Track
  console.log("\n[TEST 1/4]: Video Specimen WITHOUT Audio Track...");
  try {
    const noAudioMp4 = await createVideoWithoutAudio();
    await MediaProcessor.extractAudioTrack(noAudioMp4, 'video/mp4', 'silent_video_no_audio.mp4');
    console.error(" ❌ FAILED: Expected error was not thrown for video without audio!");
  } catch (err: any) {
    if (err.message.includes('No audio track found')) {
      console.log(` ✅ PASSED: Correctly rejected video without audio track. Error: "${err.message}"`);
      passedTests++;
    } else {
      console.error(` ❌ FAILED: Unexpected error message: "${err.message}"`);
    }
  }

  // TEST 2: Silent Audio Specimen
  console.log("\n[TEST 2/4]: Silent Audio Specimen...");
  try {
    const silentWav = createSilentWavBuffer(3.0);
    await MediaProcessor.extractAudioTrack(silentWav, 'audio/wav', 'pure_silence_specimen.wav');
    console.error(" ❌ FAILED: Expected error was not thrown for silent audio!");
  } catch (err: any) {
    if (err.message.includes('No speech detected')) {
      console.log(` ✅ PASSED: Correctly rejected silent audio. Error: "${err.message}"`);
      passedTests++;
    } else {
      console.error(` ❌ FAILED: Unexpected error message: "${err.message}"`);
    }
  }

  // TEST 3: Very Short Audio (< 1 Second)
  console.log("\n[TEST 3/4]: Short Audio Specimen (< 1 second)...");
  try {
    const shortWav = createShortWavBuffer(0.5);
    await MediaProcessor.extractAudioTrack(shortWav, 'audio/wav', 'too_short_specimen.wav');
    console.error(" ❌ FAILED: Expected error was not thrown for short audio!");
  } catch (err: any) {
    if (err.message.includes('No speech detected') || err.message.includes('too short')) {
      console.log(` ✅ PASSED: Correctly rejected short audio sample. Error: "${err.message}"`);
      passedTests++;
    } else {
      console.error(` ❌ FAILED: Unexpected error message: "${err.message}"`);
    }
  }

  // TEST 4: Corrupted Media Specimen
  console.log("\n[TEST 4/4]: Corrupted Media File Specimen...");
  try {
    const corruptedBuf = Buffer.from([0x00, 0x01, 0x02]); // Invalid 3-byte buffer
    await MediaProcessor.extractAudioTrack(corruptedBuf, 'audio/wav', 'corrupted_file.wav');
    console.error(" ❌ FAILED: Expected error was not thrown for corrupted media!");
  } catch (err: any) {
    if (err.message.includes('Corrupted or empty') || err.message.includes('media processing failed') || err.message.includes('No audio track')) {
      console.log(` ✅ PASSED: Correctly rejected corrupted media file. Error: "${err.message}"`);
      passedTests++;
    } else {
      console.error(` ❌ FAILED: Unexpected error message: "${err.message}"`);
    }
  }

  console.log("\n==========================================================================");
  console.log(`📊 SUMMARY: ${passedTests}/${totalTests} Media Validation Tests PASSED.`);
  console.log("==========================================================================");

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runValidationTests().catch((err) => {
  console.error("❌ Validation test runner failure:", err);
  process.exit(1);
});
