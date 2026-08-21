import { PrismaClient, Role, RiskLevel, DetectionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seeding]: Populating MySQL 8 database with DeepShield default enterprise data...');

  // 1. Create Default Enterprise Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'enterprise-cybersecurity-corp' },
    update: {},
    create: {
      name: 'Enterprise Cybersecurity Corp',
      slug: 'enterprise-cybersecurity-corp',
      plan: 'ENTERPRISE',
      apiKey: 'ds-api-key-live-9920183746192847',
      monthlyScanLimit: 50000,
      scansUsed: 142,
    },
  });

  // 2. Create Default Admin User & Analyst User
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@deepshield.ai' },
    update: {},
    create: {
      email: 'admin@deepshield.ai',
      passwordHash: adminPasswordHash,
      fullName: 'Alex Vance (Chief Security Officer)',
      role: Role.ADMIN,
      organizationId: org.id,
    },
  });

  const analystPasswordHash = await bcrypt.hash('AnalystPass123!', 10);
  await prisma.user.upsert({
    where: { email: 'analyst@deepshield.ai' },
    update: {},
    create: {
      email: 'analyst@deepshield.ai',
      passwordHash: analystPasswordHash,
      fullName: 'Dr. Sarah Connor (Forensic Analyst)',
      role: Role.ANALYST,
      organizationId: org.id,
    },
  });

  // 3. Seed Sample Audio Detections
  const sampleDetections = [
    {
      originalFileName: 'ceo_voice_call_verification.wav',
      storedFileName: 'ceo_voice_call_verification.wav',
      fileName: 'ceo_voice_call_verification.wav',
      mediaType: 'AUDIO',
      fileSize: 4120000,
      mimeType: 'audio/wav',
      duration: 14.5,
      durationSeconds: 14.5,
      sampleRate: 16000,
      channels: 1,
      overallScore: 0.94,
      deepfakeProbability: 0.94,
      confidence: 98,
      riskLevel: RiskLevel.CRITICAL,
      status: DetectionStatus.DEEPFAKE,
      verdict: DetectionStatus.DEEPFAKE,
      waveformData: Array.from({ length: 100 }, (_, i) => Math.sin(i * 0.2) * 0.9),
      waveformJson: Array.from({ length: 100 }, (_, i) => Math.sin(i * 0.2) * 0.9),
      spectrogramData: Array.from({ length: 32 }, () => Array.from({ length: 16 }, () => Math.random())),
      spectrogramJson: Array.from({ length: 32 }, () => Array.from({ length: 16 }, () => Math.random())),
      mfccData: Array.from({ length: 20 }, () => Array.from({ length: 13 }, (_, c) => Math.sin(c) * 10)),
      mfccJson: Array.from({ length: 20 }, () => Array.from({ length: 13 }, (_, c) => Math.sin(c) * 10)),
      pitchData: Array.from({ length: 40 }, () => 165),
      pitchJson: Array.from({ length: 40 }, () => 165),
      syntheticSegments: [
        { startTime: 2.1, endTime: 6.8, confidence: 96, type: 'RVC-v2 Synthetic Pitch Flatline', description: 'Unnatural pitch lock detected at 165Hz.' }
      ],
      organizationId: org.id,
    },
    {
      originalFileName: 'press_conference_speech.mp3',
      storedFileName: 'press_conference_speech.mp3',
      fileName: 'press_conference_speech.mp3',
      mediaType: 'AUDIO',
      fileSize: 1890000,
      mimeType: 'audio/mp3',
      duration: 8.2,
      durationSeconds: 8.2,
      sampleRate: 16000,
      channels: 1,
      overallScore: 0.06,
      deepfakeProbability: 0.06,
      confidence: 94,
      riskLevel: RiskLevel.LOW,
      status: DetectionStatus.AUTHENTIC,
      verdict: DetectionStatus.AUTHENTIC,
      waveformData: Array.from({ length: 100 }, (_, i) => Math.sin(i * 0.1) * 0.5),
      waveformJson: Array.from({ length: 100 }, (_, i) => Math.sin(i * 0.1) * 0.5),
      spectrogramData: Array.from({ length: 32 }, () => Array.from({ length: 16 }, () => Math.random())),
      spectrogramJson: Array.from({ length: 32 }, () => Array.from({ length: 16 }, () => Math.random())),
      mfccData: Array.from({ length: 20 }, () => Array.from({ length: 13 }, (_, c) => Math.sin(c) * 8)),
      mfccJson: Array.from({ length: 20 }, () => Array.from({ length: 13 }, (_, c) => Math.sin(c) * 8)),
      pitchData: Array.from({ length: 40 }, (_, i) => 140 + Math.sin(i * 0.3) * 30),
      pitchJson: Array.from({ length: 40 }, (_, i) => 140 + Math.sin(i * 0.3) * 30),
      syntheticSegments: [],
      organizationId: org.id,
    },
  ];

  for (const det of sampleDetections) {
    await prisma.detectionHistory.create({ data: det }).catch(() => null);
  }

  // 4. Seed Audit Logs & Notifications
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_BOOTSTRAP',
      resource: 'SYSTEM',
      details: { status: 'SUCCESS' },
      ipAddress: '127.0.0.1',
      userAgent: 'DeepShield-Initializer/1.0',
    },
  }).catch(() => null);

  await prisma.notification.create({
    data: {
      userId: adminUser.id,
      title: 'High Threat Deepfake Flagged',
      message: 'File ceo_voice_call_verification.wav scored 94% synthetic probability (CRITICAL RISK).',
      type: 'ALERT',
    },
  }).catch(() => null);

  console.log('[Seeding]: Complete! Admin user: admin@deepshield.ai / AdminPass123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
