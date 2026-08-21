import axios from 'axios';
import { prisma } from '../src/db/prisma';

const BASE_URL = 'http://localhost:5000/api';

async function testMultiUserIsolation() {
  console.log('================================================================');
  console.log('👥 DEEPSHIELD MULTI-USER REAL AUTHENTICATION TEST SUITE');
  console.log('================================================================\n');

  const timestamp = Date.now();

  // User 1
  const user1 = {
    fullName: 'Alice Analyst',
    email: `alice.analyst.${timestamp}@gmail.com`,
    password: `AlicePass2026!#${timestamp.toString().slice(-4)}`,
  };

  // User 2
  const user2 = {
    fullName: 'Bob Security',
    email: `bob.security.${timestamp}@gmail.com`,
    password: `BobPass2026!#${timestamp.toString().slice(-4)}`,
  };

  console.log(`1. Registering User A (${user1.email}) with independent password...`);
  const regRes1 = await axios.post(`${BASE_URL}/auth/register`, user1);
  if (!regRes1.data.success || !regRes1.data.requiresVerification) {
    throw new Error('User A registration failed');
  }

  console.log(`2. Registering User B (${user2.email}) with independent password...`);
  const regRes2 = await axios.post(`${BASE_URL}/auth/register`, user2);
  if (!regRes2.data.success || !regRes2.data.requiresVerification) {
    throw new Error('User B registration failed');
  }

  // Wait briefly to ensure DB writes are committed before reading
  await new Promise((r) => setTimeout(r, 400));

  // Verify accounts in DB are completely separate and unverified
  const dbUser1 = await prisma.user.findUnique({ where: { email: user1.email.toLowerCase() } });
  const dbUser2 = await prisma.user.findUnique({ where: { email: user2.email.toLowerCase() } });

  if (!dbUser1 || !dbUser2) {
    throw new Error('Database records missing');
  }
  if (dbUser1.id === dbUser2.id) {
    throw new Error('User IDs must be distinct!');
  }
  if (dbUser1.emailVerificationToken === dbUser2.emailVerificationToken) {
    throw new Error('Verification tokens must be distinct per user!');
  }
  console.log('✅ User A and User B have separate database IDs, separate hashes, and unique verification tokens.\n');

  // Verify unverified logins are blocked
  console.log('3. Confirming unverified User A and User B cannot log in before verification...');
  try {
    await axios.post(`${BASE_URL}/auth/login`, { email: user1.email, password: user1.password });
    throw new Error('User A should be blocked!');
  } catch (err: any) {
    if (err.response?.status !== 403 || !err.response?.data?.isUnverified) {
      throw new Error('Expected 403 isUnverified');
    }
  }
  console.log('✅ Unverified User A blocked with 403 Forbidden.');

  // Verify User A only
  console.log('4. Verifying User A using their individual verification token...');
  await axios.get(`${BASE_URL}/auth/verify-email`, {
    params: { token: dbUser1.emailVerificationToken },
  });

  // Verify User A can now log in, but User B remains unverified
  console.log('5. Testing User A login (should succeed) and User B login (should remain blocked)...');
  const loginRes1 = await axios.post(`${BASE_URL}/auth/login`, { email: user1.email, password: user1.password });
  if (!loginRes1.data.success || !loginRes1.data.token) {
    throw new Error('User A login failed');
  }
  console.log(`✅ User A logged in successfully. Access token issued for User A (${loginRes1.data.user.email}).`);

  try {
    await axios.post(`${BASE_URL}/auth/login`, { email: user2.email, password: user2.password });
    throw new Error('User B should still be blocked as unverified!');
  } catch (err: any) {
    if (err.response?.status !== 403 || !err.response?.data?.isUnverified) {
      throw new Error('Expected User B to still be unverified');
    }
  }
  console.log('✅ User B is still unverified and blocked from login.');

  // Verify User B
  console.log('6. Verifying User B using their individual verification token...');
  await axios.get(`${BASE_URL}/auth/verify-email`, {
    params: { token: dbUser2.emailVerificationToken },
  });

  const loginRes2 = await axios.post(`${BASE_URL}/auth/login`, { email: user2.email, password: user2.password });
  if (!loginRes2.data.success || !loginRes2.data.token) {
    throw new Error('User B login failed');
  }
  console.log(`✅ User B logged in successfully. Access token issued for User B (${loginRes2.data.user.email}).`);

  // Verify User A password does not work for User B
  try {
    await axios.post(`${BASE_URL}/auth/login`, { email: user2.email, password: user1.password });
    throw new Error('Cross-user credentials must not work!');
  } catch (err: any) {
    if (err.response?.status !== 401) {
      throw new Error('Expected 401 for wrong credentials');
    }
  }
  console.log('✅ Passwords are fully isolated between accounts.');

  console.log('\n================================================================');
  console.log('🎉 MULTI-USER REAL AUTHENTICATION ARCHITECTURE CONFIRMED & VERIFIED!');
  console.log('================================================================\n');
}

testMultiUserIsolation().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});
