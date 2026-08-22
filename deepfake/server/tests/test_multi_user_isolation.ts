import axios from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/db/prisma';

const API_BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'deepshield-enterprise-jwt-secret-key-production-change-this';

async function runMultiUserIsolationTestSuite() {
  console.log('\n=======================================================');
  console.log('🧪 MANDATORY DEEPSHIELD MULTI-USER DATA ISOLATION TEST');
  console.log('=======================================================\n');

  const timestamp = Date.now();
  const emailA = `testuserA.${timestamp}@example.com`;
  const nameA = 'User A (First Enterprise User)';

  const emailB = `testuserB.${timestamp}@example.com`;
  const nameB = 'User B (Second Enterprise User)';

  // Helper: Create Organization and User directly in DB for fast testing
  async function createVerifiedUser(email: string, fullName: string) {
    const org = await prisma.organization.create({
      data: {
        name: `Org-${email}`,
        slug: `org-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        plan: 'ENTERPRISE',
        apiKey: `ds-key-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      },
    });

    const passHash = await bcrypt.hash('Password123!', 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: passHash,
        fullName,
        role: 'ANALYST',
        isActive: true,
        isEmailVerified: true,
        organizationId: org.id,
      },
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return { token, user };
  }

  // STEP 1: Create User A
  console.log('[Step 1]: Creating User A...');
  const userA = await createVerifiedUser(emailA, nameA);
  console.log(`✅ User A created. ID: ${userA.user.id}, Email: ${emailA}`);

  // STEP 2: Create User B
  console.log('[Step 2]: Creating User B...');
  const userB = await createVerifiedUser(emailB, nameB);
  console.log(`✅ User B created. ID: ${userB.user.id}, Email: ${emailB}`);

  // STEP 3: User A performs 3 scans (Audio, Image, Video) and 1 Forensic Report
  console.log('\n[Step 3]: User A performing scans (Audio, Image, Video)...');
  const headersA = { Authorization: `Bearer ${userA.token}` };

  const audioScanA = await prisma.detectionHistory.create({
    data: {
      userId: userA.user.id,
      originalFileName: 'userA_audio_specimen.wav',
      storedFileName: 'userA_audio_specimen.wav',
      fileName: 'userA_audio_specimen.wav',
      mediaType: 'AUDIO',
      mimeType: 'audio/wav',
      fileSize: 1024000,
      duration: 8.5,
      durationSeconds: 8.5,
      sampleRate: 16000,
      channels: 1,
      fileHash: `hash_audio_userA_${timestamp}`,
      waveformData: [],
      waveformJson: [],
      spectrogramData: [],
      spectrogramJson: [],
      mfccData: [],
      mfccJson: [],
      pitchData: [],
      pitchJson: [],
      confidence: 0.96,
      deepfakeProbability: 0.96,
      overallScore: 0.96,
      riskLevel: 'HIGH',
      verdict: 'DEEPFAKE',
      status: 'DEEPFAKE',
      processingTime: 1.2,
      modelVersion: 'WavLM Neural Engine',
      syntheticSegments: [],
      organizationId: userA.user.organizationId,
    },
  });

  const imageScanA = await prisma.detectionHistory.create({
    data: {
      userId: userA.user.id,
      originalFileName: 'userA_image_face.png',
      storedFileName: 'userA_image_face.png',
      fileName: 'userA_image_face.png',
      mediaType: 'IMAGE',
      mimeType: 'image/png',
      fileSize: 512000,
      duration: 0.0,
      durationSeconds: 0.0,
      sampleRate: 0,
      channels: 0,
      fileHash: `hash_image_userA_${timestamp}`,
      waveformData: [],
      waveformJson: [],
      spectrogramData: [],
      spectrogramJson: [],
      mfccData: [],
      mfccJson: [],
      pitchData: [],
      pitchJson: [],
      confidence: 0.98,
      deepfakeProbability: 0.98,
      overallScore: 0.98,
      riskLevel: 'CRITICAL',
      verdict: 'DEEPFAKE',
      status: 'DEEPFAKE',
      processingTime: 0.45,
      modelVersion: 'xRayon-ConvNeXtV2-Phase2',
      syntheticSegments: [],
      organizationId: userA.user.organizationId,
    },
  });

  const videoScanA = await prisma.detectionHistory.create({
    data: {
      userId: userA.user.id,
      originalFileName: 'userA_video_clip.mp4',
      storedFileName: 'userA_video_clip.mp4',
      fileName: 'userA_video_clip.mp4',
      mediaType: 'VIDEO',
      mimeType: 'video/mp4',
      fileSize: 15400000,
      duration: 12.0,
      durationSeconds: 12.0,
      sampleRate: 0,
      channels: 0,
      fileHash: `hash_video_userA_${timestamp}`,
      waveformData: [],
      waveformJson: [],
      spectrogramData: [],
      spectrogramJson: [],
      mfccData: [],
      mfccJson: [],
      pitchData: [],
      pitchJson: [],
      confidence: 0.92,
      deepfakeProbability: 0.92,
      overallScore: 0.92,
      riskLevel: 'HIGH',
      verdict: 'DEEPFAKE',
      status: 'DEEPFAKE',
      processingTime: 3.4,
      modelVersion: 'Xception / EfficientNet Video Classifier',
      syntheticSegments: [],
      organizationId: userA.user.organizationId,
    },
  });

  const reportA = await prisma.report.create({
    data: {
      userId: userA.user.id,
      detectionId: audioScanA.id,
      title: 'Forensic PDF Certificate - userA_audio_specimen.wav',
      pdfUrl: `/api/reports/download/report_userA_${audioScanA.id}.pdf`,
      summary: 'Summary for User A scan',
      generatedBy: emailA,
    },
  });

  console.log(`✅ User A scans created: Audio (${audioScanA.id}), Image (${imageScanA.id}), Video (${videoScanA.id}). Report (${reportA.id}).`);

  // STEP 4: Login as User B & Verify User B starts at ZERO data
  console.log('\n[Step 4]: Querying API with User B token & verifying ZERO data isolation state...');
  const headersB = { Authorization: `Bearer ${userB.token}` };

  const historyB = await axios.get(`${API_BASE}/detect/history`, { headers: headersB });
  const analyticsB = await axios.get(`${API_BASE}/detect/analytics/summary`, { headers: headersB });
  const reportsB = await axios.get(`${API_BASE}/reports/history`, { headers: headersB });
  const reportStatsB = await axios.get(`${API_BASE}/reports/stats`, { headers: headersB });

  console.log('User B Detection History Items Count:', historyB.data.items.length);
  console.log('User B Analytics Total Scans:', analyticsB.data.summary.totalScans);
  console.log('User B Reports Generated Count:', reportStatsB.data.stats.reportsGenerated);

  if (historyB.data.items.length !== 0) {
    throw new Error(`DATA LEAKAGE FAILURE: User B sees ${historyB.data.items.length} history items (Expected 0)!`);
  }
  if (analyticsB.data.summary.totalScans !== 0) {
    throw new Error(`DATA LEAKAGE FAILURE: User B sees totalScans = ${analyticsB.data.summary.totalScans} (Expected 0)!`);
  }
  if (reportsB.data.reports.length !== 0) {
    throw new Error(`DATA LEAKAGE FAILURE: User B sees ${reportsB.data.reports.length} reports (Expected 0)!`);
  }
  if (reportStatsB.data.stats.reportsGenerated !== 0) {
    throw new Error(`DATA LEAKAGE FAILURE: User B sees reportsGenerated = ${reportStatsB.data.stats.reportsGenerated} (Expected 0)!`);
  }
  console.log('✅ Step 4 Passed: User B sees 0 scans, 0 analytics, and 0 reports!');

  // STEP 5: User B performs 1 Audio scan
  console.log('\n[Step 5]: User B performing 1 Audio scan...');
  const audioScanB = await prisma.detectionHistory.create({
    data: {
      userId: userB.user.id,
      originalFileName: 'userB_audio_speech.wav',
      storedFileName: 'userB_audio_speech.wav',
      fileName: 'userB_audio_speech.wav',
      mediaType: 'AUDIO',
      mimeType: 'audio/wav',
      fileSize: 840000,
      duration: 5.0,
      durationSeconds: 5.0,
      sampleRate: 16000,
      channels: 1,
      fileHash: `hash_audio_userB_${timestamp}`,
      waveformData: [],
      waveformJson: [],
      spectrogramData: [],
      spectrogramJson: [],
      mfccData: [],
      mfccJson: [],
      pitchData: [],
      pitchJson: [],
      confidence: 0.95,
      deepfakeProbability: 0.05,
      overallScore: 0.05,
      riskLevel: 'LOW',
      verdict: 'AUTHENTIC',
      status: 'AUTHENTIC',
      processingTime: 0.9,
      modelVersion: 'WavLM Neural Engine',
      syntheticSegments: [],
      organizationId: userB.user.organizationId,
    },
  });

  // STEP 6: Query User A & User B records to verify complete isolation
  console.log('\n[Step 6]: Verifying data isolation for User A and User B...');
  const historyA = await axios.get(`${API_BASE}/detect/history`, { headers: headersA });
  const historyB_after = await axios.get(`${API_BASE}/detect/history`, { headers: headersB });

  console.log(`User A sees ${historyA.data.items.length} items (Expected exactly 3).`);
  console.log(`User B sees ${historyB_after.data.items.length} items (Expected exactly 1).`);

  if (historyA.data.items.length !== 3) {
    throw new Error(`DATA ISOLATION FAILURE: User A sees ${historyA.data.items.length} items instead of 3.`);
  }
  if (historyB_after.data.items.length !== 1) {
    throw new Error(`DATA ISOLATION FAILURE: User B sees ${historyB_after.data.items.length} items instead of 1.`);
  }

  const hasLeakageInB = historyB_after.data.items.some((item: any) => item.originalFileName.includes('userA'));
  if (hasLeakageInB) {
    throw new Error('CRITICAL SECURITY FAILURE: User A filename leaked to User B!');
  }

  console.log('✅ Step 6 Passed: User A sees ONLY User A records. User B sees ONLY User B records!');

  // STEP 7: UNAUTHORIZED ACCESS TESTS (Cross-Account Attack Vector Validation)
  console.log('\n[Step 7]: Running Unauthorized Cross-Account Access Tests...');

  // Test 7A: User B attempting to access User A's audio record by ID
  console.log(`Test 7A: User B attempting GET /api/detect/${audioScanA.id}`);
  try {
    await axios.get(`${API_BASE}/detect/${audioScanA.id}`, { headers: headersB });
    throw new Error('SECURITY VIOLATION: User B was allowed to access User A detection record by ID!');
  } catch (err: any) {
    const status = err.response?.status;
    console.log(`Returned status: ${status} (404/403 Expected)`);
    if (status !== 404 && status !== 403) {
      throw new Error(`SECURITY VIOLATION: Unexpected status ${status} when User B tried accessing User A record.`);
    }
  }
  console.log('✅ Test 7A Passed: User B forbidden from accessing User A record ID.');

  // Test 7B: User A attempting to access User B's audio record by ID
  console.log(`Test 7B: User A attempting GET /api/detect/${audioScanB.id}`);
  try {
    await axios.get(`${API_BASE}/detect/${audioScanB.id}`, { headers: headersA });
    throw new Error('SECURITY VIOLATION: User A was allowed to access User B detection record by ID!');
  } catch (err: any) {
    const status = err.response?.status;
    console.log(`Returned status: ${status} (404/403 Expected)`);
    if (status !== 404 && status !== 403) {
      throw new Error(`SECURITY VIOLATION: Unexpected status ${status} when User A tried accessing User B record.`);
    }
  }
  console.log('✅ Test 7B Passed: User A forbidden from accessing User B record ID.');

  // Test 7C: User B attempting to download User A's report file
  console.log(`Test 7C: User B attempting GET /api/reports/download/report_userA_${audioScanA.id}.pdf`);
  try {
    await axios.get(`${API_BASE}/reports/download/report_userA_${audioScanA.id}.pdf`, { headers: headersB });
    throw new Error('SECURITY VIOLATION: User B was allowed to download User A report file!');
  } catch (err: any) {
    const status = err.response?.status;
    console.log(`Returned status: ${status} (403/404 Expected)`);
    if (status !== 403 && status !== 404) {
      throw new Error(`SECURITY VIOLATION: Unexpected status ${status} when User B tried downloading User A report.`);
    }
  }
  console.log('✅ Test 7C Passed: User B forbidden from downloading User A report file.');

  // Clean up test data
  console.log('\n🧹 Cleaning up test users & records from database...');
  await prisma.report.deleteMany({
    where: { userId: { in: [userA.user.id, userB.user.id] } },
  });
  await prisma.detectionHistory.deleteMany({
    where: { userId: { in: [userA.user.id, userB.user.id] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [userA.user.id, userB.user.id] } },
  });
  await prisma.organization.deleteMany({
    where: { id: { in: [userA.user.organizationId, userB.user.organizationId] } },
  });
  console.log('✅ Test data cleaned up.');

  console.log('\n=======================================================');
  console.log('🎉 ALL MULTI-USER DATA ISOLATION TESTS PASSED 100%!');
  console.log('=======================================================\n');
}

runMultiUserIsolationTestSuite().catch((err) => {
  console.error('\n❌ MULTI-USER TEST FAILED:', err.response?.data || err.message);
  process.exit(1);
});
