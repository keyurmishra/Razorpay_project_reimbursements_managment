'use strict';

const request = require('supertest');
const app = require('../../src/app');
const { setupDatabase, seedUser, db } = require('../helpers/setup');

describe('Auth Integration Tests', () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('POST /rest/onboardings/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/rest/onboardings/register')
        .send({
          name: 'John Doe',
          email: 'john@org.com',
          password: 'Password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('john@org.com');
      // EMP should be default role
      expect(res.body.data.user.role).toBe('EMP');
      
      // Cookie should be set
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should fail with invalid email domain', async () => {
      const res = await request(app)
        .post('/rest/onboardings/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@gmail.com',
          password: 'Password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toContain('email must belong to the @org.com domain.');
    });

    it('should fail if email already exists', async () => {
      // First seed a user
      await seedUser('Alice', 'alice@org.com', 'Pass1234', 'EMP');

      const res = await request(app)
        .post('/rest/onboardings/register')
        .send({
          name: 'Alice Two',
          email: 'alice@org.com',
          password: 'Password123',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/exists/i);
    });
  });

  describe('POST /rest/onboardings/login', () => {
    beforeEach(async () => {
      await setupDatabase();
      await seedUser('Bob', 'bob@org.com', 'Password123', 'EMP');
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/rest/onboardings/login')
        .send({
          email: 'bob@org.com',
          password: 'Password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should fail with incorrect password', async () => {
      const res = await request(app)
        .post('/rest/onboardings/login')
        .send({
          email: 'bob@org.com',
          password: 'WrongPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
