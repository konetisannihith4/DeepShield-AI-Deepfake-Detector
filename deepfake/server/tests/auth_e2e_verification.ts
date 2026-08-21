import axios from 'axios';
import { prisma } from '../src/db/prisma';

const BASE_URL = 'http://localhost:5000/api';

async function runRealEmailAuthE2ETests() {
  console.log('================================================================');
  console.log('🔒 DEEPSHIELD REAL EMAIL AUTHENTICATION E2E TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const test = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err.response?.data || err.message);
      failed++;
    }
  };

  const uniqueSuffix = Date.now();
  // Simulating real user Gmail / Corporate email
  const userRealEmail = `user.real.${uniqueSuffix}@gmail.com`;
  const userChosenPassword = `MasterSecurePass2026!#${uniqueSuffix.toString().slice(-4)}`;
  let verificationToken = '';
  let accessToken = '';
  let refreshToken = '';
  let resetToken = '';

  // 1. Sign up with user's own email and chosen password
  await test('1. Create account with real email and chosen password', async () => {
    const res = await axios.post(`${BASE_URL}/auth/register`, {
      email: userRealEmail,
      password: userChosenPassword,
      fullName: 'Dr. Jane Analyst',
      organizationName: `Global Threat Intelligence Unit ${uniqueSuffix}`,
    });

    if (!res.data.success || !res.data.requiresVerification) {
      throw new Error('Registration should require email verification');
    }
    if (res.data.email !== userRealEmail.toLowerCase()) {
      throw new Error(`Email mismatch: received ${res.data.email}`);
    }
  });

  // 2. Verify account exists in DB with isEmailVerified: false
  await test('2. Account in database is marked unverified (isEmailVerified: false)', async () => {
    const userInDb = await prisma.user.findUnique({
      where: { email: userRealEmail.toLowerCase() },
    });
    if (!userInDb) {
      throw new Error('User not found in MySQL database');
    }
    if (userInDb.isEmailVerified !== false) {
      throw new Error('User should be unverified upon initial registration');
    }
    if (!userInDb.emailVerificationToken) {
      throw new Error('Missing email verification token in database');
    }
    verificationToken = userInDb.emailVerificationToken;
  });

  // 3. Attempt login BEFORE email verification (must be blocked)
  await test('3. Unverified account cannot sign in (blocked with 403 & isUnverified flag)', async () => {
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: userRealEmail,
        password: userChosenPassword,
      });
      throw new Error('Unverified user was allowed to login!');
    } catch (err: any) {
      if (err.response?.status !== 403) {
        throw new Error(`Expected 403 Forbidden, got ${err.response?.status}`);
      }
      if (!err.response?.data?.isUnverified) {
        throw new Error('Missing isUnverified flag in 403 response');
      }
    }
  });

  // 4. Test Resend Verification Email endpoint
  await test('4. Resend verification email endpoint dispatches a fresh token', async () => {
    const res = await axios.post(`${BASE_URL}/auth/resend-verification`, {
      email: userRealEmail,
    });
    if (!res.data.success) {
      throw new Error('Failed to resend verification email');
    }

    const updatedUser = await prisma.user.findUnique({
      where: { email: userRealEmail.toLowerCase() },
    });
    if (!updatedUser?.emailVerificationToken) {
      throw new Error('Failed to generate updated verification token');
    }
    verificationToken = updatedUser.emailVerificationToken;
  });

  // 5. Verify email address via cryptographic token
  await test('5. Verify email via GET /api/auth/verify-email?token=...', async () => {
    const res = await axios.get(`${BASE_URL}/auth/verify-email`, {
      params: { token: verificationToken },
    });
    if (!res.data.success) {
      throw new Error('Email verification failed');
    }

    const verifiedUser = await prisma.user.findUnique({
      where: { email: userRealEmail.toLowerCase() },
    });
    if (!verifiedUser?.isEmailVerified) {
      throw new Error('User was not marked verified in database');
    }
    if (verifiedUser.emailVerificationToken !== null) {
      throw new Error('Verification token was not consumed');
    }
  });

  // 6. Attempt login AFTER verification (must succeed)
  await test('6. Verified user signs in successfully with email + password', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: userRealEmail,
      password: userChosenPassword,
    });
    if (!res.data.success || !res.data.token || !res.data.refreshToken) {
      throw new Error('Login failed or tokens missing in response');
    }
    accessToken = res.data.token;
    refreshToken = res.data.refreshToken;
  });

  // 7. Verify wrong password fails
  await test('7. Reject wrong password with 401 Unauthorized', async () => {
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: userRealEmail,
        password: 'IncorrectPassword999!',
      });
      throw new Error('Should have rejected wrong password');
    } catch (err: any) {
      if (err.response?.status !== 401) {
        throw new Error(`Expected 401, got ${err.response?.status}`);
      }
    }
  });

  // 8. Access protected routes with Bearer token
  await test('8. Access protected routes with Bearer token (/api/detect/history)', async () => {
    const res = await axios.get(`${BASE_URL}/detect/history`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status !== 200) {
      throw new Error(`Protected route returned ${res.status}`);
    }
  });

  // 9. Session / Me verification
  await test('9. Get authenticated profile via /api/auth/me', async () => {
    const res = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.data.success || res.data.user.email !== userRealEmail.toLowerCase()) {
      throw new Error('Profile response mismatch');
    }
  });

  // 10. Forgot Password email dispatch
  await test('10. Request password reset via /api/auth/forgot-password', async () => {
    const res = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: userRealEmail,
    });
    if (!res.data.success) {
      throw new Error('Forgot password request failed');
    }

    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: { user: { email: userRealEmail.toLowerCase() }, used: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!resetRecord) {
      throw new Error('Reset token was not created in database');
    }
    resetToken = resetRecord.token;
  });

  // 11. Verify password reset token
  await test('11. Validate reset token via /api/auth/verify-reset-token', async () => {
    const res = await axios.get(`${BASE_URL}/auth/verify-reset-token`, {
      params: { token: resetToken },
    });
    if (!res.data.success || !res.data.valid) {
      throw new Error('Reset token verification failed');
    }
  });

  // 12. Reset password to a new password
  const newPassword = `NewMasterPass2026!#${uniqueSuffix.toString().slice(-4)}`;
  await test('12. Reset password via /api/auth/reset-password', async () => {
    const res = await axios.post(`${BASE_URL}/auth/reset-password`, {
      token: resetToken,
      password: newPassword,
    });
    if (!res.data.success) {
      throw new Error('Password reset failed');
    }
  });

  // 13. Verify OLD password is now rejected
  await test('13. Login with OLD password is now rejected (401)', async () => {
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: userRealEmail,
        password: userChosenPassword,
      });
      throw new Error('Old password should not work after reset');
    } catch (err: any) {
      if (err.response?.status !== 401) {
        throw new Error(`Expected 401, got ${err.response?.status}`);
      }
    }
  });

  // 14. Verify NEW password succeeds
  await test('14. Login with NEW password succeeds', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: userRealEmail,
      password: newPassword,
    });
    if (!res.data.success || !res.data.token) {
      throw new Error('Login with new password failed');
    }
    accessToken = res.data.token;
    refreshToken = res.data.refreshToken;
  });

  // 15. Logout and revoke token
  await test('15. Logout and session invalidation', async () => {
    const res = await axios.post(
      `${BASE_URL}/auth/logout`,
      { refreshToken },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.data.success) {
      throw new Error('Logout failed');
    }
  });

  console.log('\n================================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runRealEmailAuthE2ETests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
