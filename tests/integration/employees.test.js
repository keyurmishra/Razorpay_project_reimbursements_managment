'use strict';

const request = require('supertest');
const app = require('../../src/app');
const { setupDatabase, seedUser, getAuthCookie, db } = require('../helpers/setup');

describe('Employees Integration Tests', () => {
  let cfoCookie;
  let empCookie;
  let empUser;
  let rmUser;
  let anotherRmUser;

  beforeAll(async () => {
    await setupDatabase();
    
    await seedUser('CFO User', 'cfo@org.com', 'Password123', 'CFO');
    cfoCookie = await getAuthCookie('cfo@org.com', 'Password123');

    empUser = await seedUser('EMP User', 'emp@org.com', 'Password123', 'EMP');
    empCookie = await getAuthCookie('emp@org.com', 'Password123');

    rmUser = await seedUser('RM User', 'rm@org.com', 'Password123', 'RM');
    anotherRmUser = await seedUser('Another RM', 'anotherrm@org.com', 'Password123', 'RM');
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('POST /rest/employees/assign', () => {
    it('should allow CFO to assign an EMP to an RM', async () => {
      const res = await request(app)
        .post('/rest/employees/assign')
        .set('Cookie', cfoCookie)
        .send({
          employeeId: empUser.id,
          managerId: rmUser.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assignment.employeeId).toBe(empUser.id);
      expect(res.body.data.assignment.managerId).toBe(rmUser.id);
    });

    it('should enforce one-manager-per-employee rule', async () => {
      const res = await request(app)
        .post('/rest/employees/assign')
        .set('Cookie', cfoCookie)
        .send({
          employeeId: empUser.id,
          managerId: anotherRmUser.id,
        });

      expect(res.status).toBe(409); // Conflict
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already has a manager assigned/i);
    });

    it('should reject assignment if the manager is not an RM', async () => {
      const newEmp = await seedUser('New EMP', 'newemp@org.com', 'Password123', 'EMP');
      
      const res = await request(app)
        .post('/rest/employees/assign')
        .set('Cookie', cfoCookie)
        .send({
          employeeId: newEmp.id,
          managerId: empUser.id, // empUser is not an RM
        });

      expect(res.status).toBe(422); // Unprocessable Entity
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Only users with role 'RM' can be assigned as managers/i);
    });

    it('should reject non-CFO roles (Authorization Checks)', async () => {
      const res = await request(app)
        .post('/rest/employees/assign')
        .set('Cookie', empCookie) // EMP trying to assign
        .send({
          employeeId: empUser.id,
          managerId: rmUser.id,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /rest/employees/assign', () => {
    it('should reject non-CFO roles', async () => {
      const res = await request(app)
        .delete('/rest/employees/assign')
        .set('Cookie', empCookie)
        .send({ employeeId: empUser.id });

      expect(res.status).toBe(403);
    });

    it('should allow CFO to remove manager assignment', async () => {
      const res = await request(app)
        .delete('/rest/employees/assign')
        .set('Cookie', cfoCookie)
        .send({ employeeId: empUser.id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
