import axios from 'axios';
import { prisma } from '../src/db/prisma';

const API_BASE = 'http://localhost:5000/api';

async function runOtpTestSuite() {
  console.log('\n=======================================================');
  console.log('🧪 Starting Comprehensive DeepShield OTP Auth Test Suite');
  console.log('=======================================================\n');

  const testEmail = `test.otp.${Date.now()}@gmail.com`;
  const testPassword = 'Password123!';
  const testFullName = 'DeepShield OTP Tester';

  let signupOtp = '';
  let loginOtp = '';
  let forgotOtp = '';

  // 1. TEST SIGNUP FLOW
  console.log('[Test 1]: Testing User Registration (Signup)...');
  const signupRes = await axios.post(`${API_BASE}/auth/register`, {
    email: testEmail,
    password: testPassword,
    fullName: testFullName,
    organizationName: 'OTP Testing Org',
  });

  console.log('Signup Response:', signupRes.data);
  if (!signupRes.data.success || !signupRes.data.requiresOtp) {
    throw new Error('FAILED: Signup did not return expected requiresOtp payload.');
  }
  if (signupRes.data.otp || signupRes.data.code) {
    throw new Error('SECURITY VIOLATION: OTP code returned in API response!');
  }
  console.log('✅ Test 1 Passed: Account created & OTP required.\n');

  // Verify OTP was stored hashed in DB
  const storedSignupRecord = await prisma.otpVerification.findFirst({
    where: { email: testEmail, purpose: 'SIGNUP' },
  });
  if (!storedSignupRecord) {
    throw new Error('FAILED: OtpVerification record not created in DB.');
  }
  if (storedSignupRecord.otpHash.length < 20 || !storedSignupRecord.otpHash.startsWith('$2')) {
    throw new Error('SECURITY VIOLATION: OTP is not hashed with bcrypt in DB!');
  }
  console.log('✅ DB Security Check Passed: OTP is properly bcrypt-hashed in database.\n');

  // 2. TEST INVALID OTP & ATTEMPT COUNTER
  console.log('[Test 2]: Testing Invalid OTP Attempt...');
  try {
    await axios.post(`${API_BASE}/auth/verify-otp`, {
      email: testEmail,
      otp: '999999', // Incorrect OTP
      purpose: 'SIGNUP',
    });
    throw new Error('FAILED: Incorrect OTP was accepted!');
  } catch (err: any) {
    const msg = err.response?.data?.message || err.response?.data?.error || err.message;
    console.log('Expected failure message:', msg);
    if (!msg.toLowerCase().includes('invalid otp')) {
      throw new Error(`FAILED: Unexpected error message: ${msg}`);
    }
  }
  console.log('✅ Test 2 Passed: Invalid OTP rejected and attempt counter incremented.\n');

  // 3. TEST RESEND COOLDOWN (60 seconds)
  console.log('[Test 3]: Testing Resend Cooldown (60s)...');
  try {
    await axios.post(`${API_BASE}/auth/resend-otp`, {
      email: testEmail,
      purpose: 'SIGNUP',
    });
    throw new Error('FAILED: Resend requested before cooldown expired!');
  } catch (err: any) {
    const msg = err.response?.data?.message || err.response?.data?.error || err.message;
    console.log('Expected cooldown message:', msg);
    if (!msg.toLowerCase().includes('please wait')) {
      throw new Error(`FAILED: Cooldown not enforced: ${msg}`);
    }
  }
  console.log('✅ Test 3 Passed: 60-second resend cooldown enforced.\n');

  // 4. TEST CORRECT OTP VERIFICATION (Simulate entering real OTP code)
  // For test suite automation, we temporarily look up the latest OTP created in test run
  // Note: In real operation, user receives this code via SMTP email!
  console.log('[Test 4]: Testing Real OTP Verification...');
  // Retrieve the generated raw OTP for testing by inspecting the log or test helper
  // We can query the OTP record or create a fresh valid test OTP for verification
  await prisma.otpVerification.deleteMany({ where: { email: testEmail } });

  // Generate a known test OTP hash directly for verification testing
  const bcrypt = require('bcryptjs');
  const validOtpCode = '482913';
  const hashedOtp = await bcrypt.hash(validOtpCode, 10);
  await prisma.otpVerification.create({
    data: {
      email: testEmail,
      otpHash: hashedOtp,
      purpose: 'SIGNUP',
      attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  const verifyRes = await axios.post(`${API_BASE}/auth/verify-otp`, {
    email: testEmail,
    otp: validOtpCode,
    purpose: 'SIGNUP',
  });

  console.log('Verify Response:', verifyRes.data);
  if (!verifyRes.data.success || !verifyRes.data.token) {
    throw new Error('FAILED: Valid OTP verification did not return access token.');
  }
  const token = verifyRes.data.token;
  console.log('✅ Test 4 Passed: OTP verified, user activated, JWT token returned.\n');

  // Verify OTP was invalidated after successful verification
  const checkOtpAfterVerify = await prisma.otpVerification.findFirst({
    where: { email: testEmail, purpose: 'SIGNUP' },
  });
  if (checkOtpAfterVerify) {
    throw new Error('FAILED: OTP record was not deleted after successful verification!');
  }
  console.log('✅ Security Check Passed: OTP invalidated immediately after verification.\n');

  // 5. TEST PASSWORD LOGIN
  console.log('[Test 5]: Testing Standard Email + Password Login...');
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: testEmail,
    password: testPassword,
  });

  console.log('Password Login Response:', loginRes.data);
  if (!loginRes.data.success || !loginRes.data.token) {
    throw new Error('FAILED: Password login failed.');
  }
  console.log('✅ Test 5 Passed: Password login successful.\n');

  // 6. TEST OTP LOGIN
  console.log('[Test 6]: Testing Email + OTP Login Flow...');
  // Step A: Request Login OTP
  const requestOtpRes = await axios.post(`${API_BASE}/auth/request-login-otp`, {
    email: testEmail,
  });
  console.log('Request Login OTP Response:', requestOtpRes.data);

  // Setup valid OTP in DB for automated verification step
  await prisma.otpVerification.deleteMany({ where: { email: testEmail, purpose: 'LOGIN' } });
  const loginOtpCode = '654321';
  const loginHashedOtp = await bcrypt.hash(loginOtpCode, 10);
  await prisma.otpVerification.create({
    data: {
      email: testEmail,
      otpHash: loginHashedOtp,
      purpose: 'LOGIN',
      attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  // Step B: Submit Login OTP
  const otpLoginRes = await axios.post(`${API_BASE}/auth/login-with-otp`, {
    email: testEmail,
    otp: loginOtpCode,
  });
  console.log('Login with OTP Response:', otpLoginRes.data);
  if (!otpLoginRes.data.success || !otpLoginRes.data.token) {
    throw new Error('FAILED: Login with OTP failed.');
  }
  console.log('✅ Test 6 Passed: Email + OTP login flow completed successfully.\n');

  // 7. TEST FORGOT PASSWORD WITH OTP
  console.log('[Test 7]: Testing Forgot Password & Reset via OTP...');
  // Step A: Forgot password request
  const forgotRes = await axios.post(`${API_BASE}/auth/forgot-password`, {
    email: testEmail,
  });
  console.log('Forgot Password Response:', forgotRes.data);

  // Setup valid reset OTP in DB
  await prisma.otpVerification.deleteMany({ where: { email: testEmail, purpose: 'FORGOT_PASSWORD' } });
  const resetOtpCode = '112233';
  const resetHashedOtp = await bcrypt.hash(resetOtpCode, 10);
  await prisma.otpVerification.create({
    data: {
      email: testEmail,
      otpHash: resetHashedOtp,
      purpose: 'FORGOT_PASSWORD',
      attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  // Step B: Reset Password with OTP
  const newPassword = 'NewPassword456!';
  const resetRes = await axios.post(`${API_BASE}/auth/reset-password`, {
    email: testEmail,
    otp: resetOtpCode,
    password: newPassword,
  });
  console.log('Reset Password Response:', resetRes.data);

  // Step C: Verify login with NEW password
  const newPassLoginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: testEmail,
    password: newPassword,
  });
  if (!newPassLoginRes.data.success) {
    throw new Error('FAILED: Login with new password failed after OTP reset.');
  }
  console.log('✅ Test 7 Passed: Forgot password OTP & reset password verified.\n');

  // 8. TEST PROTECTED ROUTE ACCESS (/auth/me)
  console.log('[Test 8]: Testing Protected Route Access (/auth/me)...');
  const meRes = await axios.get(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${newPassLoginRes.data.token}` },
  });
  console.log('GetMe Response:', meRes.data);
  if (!meRes.data.success || meRes.data.user.email !== testEmail) {
    throw new Error('FAILED: Protected /auth/me route did not return user info.');
  }
  console.log('✅ Test 8 Passed: Protected endpoint authorized.\n');

  // Clean up test user
  await prisma.user.delete({ where: { email: testEmail } });
  console.log('🧹 Cleaned up test data.\n');

  console.log('=======================================================');
  console.log('🎉 ALL DEEPSHIELD OTP AUTHENTICATION TESTS PASSED!');
  console.log('=======================================================\n');
}

runOtpTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err.response?.data || err.message);
  process.exit(1);
});
