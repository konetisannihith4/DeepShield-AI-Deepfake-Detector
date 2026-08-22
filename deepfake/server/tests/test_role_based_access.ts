import axios from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/db/prisma';

const API_BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'deepshield-enterprise-jwt-secret-key-production-change-this';

async function runRoleBasedAccessTestSuite() {
  console.log('\n=======================================================');
  console.log('🧪 DEEPSHIELD ROLE-BASED ACCESS CONTROL (RBAC) TEST');
  console.log('=======================================================\n');

  const timestamp = Date.now();

  // Helper: Create Organization and User with explicit Role
  async function createUserWithRole(email: string, role: 'ANALYST' | 'ADMIN') {
    const org = await prisma.organization.create({
      data: {
        name: `Org-RBAC-${timestamp}-${role}`,
        slug: `org-rbac-${timestamp}-${role.toLowerCase()}-${Math.random().toString(36).substring(7)}`,
        plan: 'ENTERPRISE',
        apiKey: `ds-key-${timestamp}-${Math.random().toString(36).substring(7)}`,
      },
    });

    const passHash = await bcrypt.hash('Password123!', 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: passHash,
        fullName: `Test ${role} User`,
        role: role,
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

    return { token, user, org };
  }

  // 1. Create Analyst and Admin users
  console.log('[Step 1]: Creating Analyst user & Admin user...');
  const analyst = await createUserWithRole(`analyst.${timestamp}@example.com`, 'ANALYST');
  const admin = await createUserWithRole(`admin.${timestamp}@example.com`, 'ADMIN');
  console.log(`✅ Analyst User created: ID ${analyst.user.id}`);
  console.log(`✅ Admin User created: ID ${admin.user.id}`);

  const headersAnalyst = { Authorization: `Bearer ${analyst.token}` };
  const headersAdmin = { Authorization: `Bearer ${admin.token}` };

  // 2. Test Admin Endpoints with Analyst Token (Expect 403 Forbidden for all)
  console.log('\n[Step 2]: Testing Admin endpoints with ANALYST role (Expect 403 Forbidden)...');

  const adminEndpoints = [
    { name: 'GET /api/users', url: `${API_BASE}/users` },
    { name: 'GET /api/organizations', url: `${API_BASE}/organizations` },
    { name: 'GET /api/audit-logs', url: `${API_BASE}/audit-logs` },
    { name: 'GET /api/settings', url: `${API_BASE}/settings` },
    { name: 'GET /api/model/details', url: `${API_BASE}/model/details` },
  ];

  for (const ep of adminEndpoints) {
    try {
      await axios.get(ep.url, { headers: headersAnalyst });
      throw new Error(`RBAC VIOLATION: Analyst was granted access to ${ep.name}!`);
    } catch (err: any) {
      const status = err.response?.status;
      console.log(`  ${ep.name} -> Returned status: ${status} (403 Forbidden Expected)`);
      if (status !== 403) {
        throw new Error(`RBAC VIOLATION: Expected 403 Forbidden for ${ep.name}, received ${status}.`);
      }
    }
  }
  console.log('✅ Analyst access control verified: 403 Forbidden for all administrative endpoints!');

  // 3. Test Admin Endpoints with Admin Token (Expect 200 OK for all)
  console.log('\n[Step 3]: Testing Admin endpoints with ADMIN role (Expect 200 OK)...');

  for (const ep of adminEndpoints) {
    const res = await axios.get(ep.url, { headers: headersAdmin });
    console.log(`  ${ep.name} -> Returned status: ${res.status} OK`);
    if (res.status !== 200) {
      throw new Error(`ADMIN ACCESS FAILURE: Admin was denied access to ${ep.name}`);
    }
  }
  console.log('✅ Admin access control verified: 200 OK for all administrative endpoints!');

  // 4. Test Normal User AI Detection Endpoints for Analyst (Expect 200 OK)
  console.log('\n[Step 4]: Testing AI Detection Telemetry endpoints for ANALYST role (Expect 200 OK)...');
  const userEndpoints = [
    { name: 'GET /api/detect/history', url: `${API_BASE}/detect/history` },
    { name: 'GET /api/detect/analytics/summary', url: `${API_BASE}/detect/analytics/summary` },
    { name: 'GET /api/reports/history', url: `${API_BASE}/reports/history` },
    { name: 'GET /api/reports/stats', url: `${API_BASE}/reports/stats` },
  ];

  for (const ep of userEndpoints) {
    const res = await axios.get(ep.url, { headers: headersAnalyst });
    console.log(`  ${ep.name} -> Returned status: ${res.status} OK`);
    if (res.status !== 200) {
      throw new Error(`ANALYST ACCESS FAILURE: Analyst denied access to ${ep.name}`);
    }
  }
  console.log('✅ Analyst standard AI telemetry endpoints functioning cleanly!');

  // Cleanup
  console.log('\n🧹 Cleaning up test users from database...');
  await prisma.user.deleteMany({
    where: { id: { in: [analyst.user.id, admin.user.id] } },
  });
  await prisma.organization.deleteMany({
    where: { id: { in: [analyst.org.id, admin.org.id] } },
  });
  console.log('✅ Cleaned up.');

  console.log('\n=======================================================');
  console.log('🎉 ALL ROLE-BASED ACCESS CONTROL (RBAC) TESTS PASSED 100%!');
  console.log('=======================================================\n');
}

runRoleBasedAccessTestSuite().catch((err) => {
  console.error('\n❌ RBAC TEST FAILED:', err.response?.data || err.message);
  process.exit(1);
});
