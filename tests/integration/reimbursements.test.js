'use strict';

const request = require('supertest');
const app = require('../../src/app');
const { setupDatabase, seedUser, getAuthCookie, db } = require('../helpers/setup');

describe('Reimbursements Integration Tests', () => {
  let cfoCookie, apeCookie, rmCookie, empCookie;
  let empUser, rmUser;
  let reimbursementId;

  beforeAll(async () => {
    await setupDatabase();
    
    await seedUser('CFO User', 'cfo@org.com', 'Password123', 'CFO');
    cfoCookie = await getAuthCookie('cfo@org.com', 'Password123');

    await seedUser('APE User', 'ape@org.com', 'Password123', 'APE');
    apeCookie = await getAuthCookie('ape@org.com', 'Password123');

    rmUser = await seedUser('RM User', 'rm@org.com', 'Password123', 'RM');
    rmCookie = await getAuthCookie('rm@org.com', 'Password123');

    empUser = await seedUser('EMP User', 'emp@org.com', 'Password123', 'EMP');
    empCookie = await getAuthCookie('emp@org.com', 'Password123');

    // Assign EMP to RM using DB directly for setup
    await db.EmployeeManager.create({ employeeId: empUser.id, managerId: rmUser.id });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('POST /rest/reimbursements', () => {
    it('should allow EMP to create a reimbursement with PENDING status', async () => {
      const res = await request(app)
        .post('/rest/reimbursements')
        .set('Cookie', empCookie)
        .send({
          title: 'Client Dinner',
          description: 'Dinner with potential clients',
          amount: 150.50,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reimbursement.status).toBe('PENDING');
      
      reimbursementId = res.body.data.reimbursement.id;
    });

    it('should prevent non-EMP from creating reimbursements', async () => {
      const res = await request(app)
        .post('/rest/reimbursements')
        .set('Cookie', rmCookie)
        .send({
          title: 'Office Supplies',
          amount: 50.00,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /rest/reimbursements/:id/decision', () => {
    it('should allow RM to approve a PENDING reimbursement', async () => {
      const res = await request(app)
        .post(`/rest/reimbursements/${reimbursementId}/decision`)
        .set('Cookie', rmCookie)
        .send({ decision: 'APPROVED' });

      expect(res.status).toBe(201); // The approval record creation
      expect(res.body.data.reimbursement.status).toBe('RM_APPROVED');
    });

    it('should prevent duplicate approvals by the same role (e.g. RM approving again)', async () => {
      const res = await request(app)
        .post(`/rest/reimbursements/${reimbursementId}/decision`)
        .set('Cookie', rmCookie)
        .send({ decision: 'APPROVED' });

      expect(res.status).toBe(409); // Conflict
      expect(res.body.message).toMatch(/already recorded a decision/i);
    });

    it('should allow APE to approve an RM_APPROVED reimbursement', async () => {
      const res = await request(app)
        .post(`/rest/reimbursements/${reimbursementId}/decision`)
        .set('Cookie', apeCookie)
        .send({ decision: 'APPROVED' });

      expect(res.status).toBe(201);
      expect(res.body.data.reimbursement.status).toBe('APPROVED');
    });

    it('should reject actions on terminal states (e.g. CFO approving an already APPROVED one)', async () => {
      const res = await request(app)
        .post(`/rest/reimbursements/${reimbursementId}/decision`)
        .set('Cookie', cfoCookie)
        .send({ decision: 'APPROVED' });

      expect(res.status).toBe(422); // Unprocessable Entity
      expect(res.body.message).toMatch(/cannot be changed/i);
    });

    it('should allow CFO to bypass and approve a PENDING reimbursement', async () => {
      // Create a new PENDING reimbursement
      const createRes = await request(app)
        .post('/rest/reimbursements')
        .set('Cookie', empCookie)
        .send({
          title: 'Flight Ticket',
          amount: 500.00,
        });
      const newId = createRes.body.data.reimbursement.id;

      // CFO approves directly
      const approveRes = await request(app)
        .post(`/rest/reimbursements/${newId}/decision`)
        .set('Cookie', cfoCookie)
        .send({ decision: 'APPROVED' });

      expect(approveRes.status).toBe(201);
      // Depending on the exact state machine rules in service, it might go to RM_APPROVED or APPROVED.
      // Based on the code, CFO on PENDING transitions to RM_APPROVED, then CFO on RM_APPROVED transitions to APPROVED.
      // Or if CFO acts on PENDING, state is RM_APPROVED. Let's assert what the actual transition is.
      // Actually, looking at reimbursements.service.js from earlier, CFO approving PENDING sets it to RM_APPROVED.
      expect(approveRes.body.data.reimbursement.status).toBe('RM_APPROVED');
    });
  });
});
