'use strict';

const request = require('supertest');
const app = require('../../src/app');
const { setupDatabase, seedUser, getAuthCookie, db } = require('../helpers/setup');

describe('Roles Integration Tests', () => {
  let cfoCookie;
  let empCookie;
  let targetUserId;

  beforeAll(async () => {
    await setupDatabase();
    
    // Create CFO and get cookie
    await seedUser('CFO User', 'cfo@org.com', 'Password123', 'CFO');
    cfoCookie = await getAuthCookie('cfo@org.com', 'Password123');

    // Create standard EMP and get cookie
    await seedUser('EMP User', 'emp@org.com', 'Password123', 'EMP');
    empCookie = await getAuthCookie('emp@org.com', 'Password123');

    // Create target user for role updates
    const target = await seedUser('Target User', 'target@org.com', 'Password123', 'EMP');
    targetUserId = target.id;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('POST /rest/roles/assign', () => {
    it('should allow CFO to assign a role', async () => {
      const res = await request(app)
        .post('/rest/roles/assign')
        .set('Cookie', cfoCookie)
        .send({
          userId: targetUserId,
          role: 'RM',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('RM');
    });

    it('should reject assignment by non-CFO roles (Authorization Checks)', async () => {
      const res = await request(app)
        .post('/rest/roles/assign')
        .set('Cookie', empCookie)
        .send({
          userId: targetUserId,
          role: 'APE',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Access denied/i);
    });

    it('should validate request body', async () => {
      const res = await request(app)
        .post('/rest/roles/assign')
        .set('Cookie', cfoCookie)
        .send({
          userId: targetUserId,
          role: 'INVALID_ROLE',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });
});
