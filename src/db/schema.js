'use strict';

const {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  decimal,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
} = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');

// ── Enums ─────────────────────────────────────────────────────────────────────
const userRoleEnum = pgEnum('user_role', ['EMP', 'RM', 'APE', 'CFO']);
const reimbursementStatusEnum = pgEnum('reimbursement_status', [
  'PENDING',
  'RM_APPROVED',
  'APPROVED',
  'REJECTED',
  'PAID',
]);
const approvalDecisionEnum = pgEnum('approval_decision', ['APPROVED', 'REJECTED']);

// ── Tables ────────────────────────────────────────────────────────────────────

const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    email: varchar('email', { length: 100 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: userRoleEnum('role').default('EMP').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => ({
    emailUniqueIdx: uniqueIndex('users_email_unique_idx').on(table.email),
  })
);

const employeeManagers = pgTable(
  'employee_managers',
  {
    id: serial('id').primaryKey(),
    employeeId: integer('employee_id')
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' })
      .notNull(),
    managerId: integer('manager_id')
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => ({
    employeeIdUniqueIdx: uniqueIndex('employee_managers_employee_id_unique_idx').on(
      table.employeeId
    ),
    managerIdIdx: index('employee_managers_manager_id_idx').on(table.managerId),
  })
);

const reimbursements = pgTable(
  'reimbursements',
  {
    id: serial('id').primaryKey(),
    employeeId: integer('employee_id')
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' })
      .notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    status: reimbursementStatusEnum('status').default('PENDING').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => ({
    employeeIdIdx: index('reimbursements_employee_id_idx').on(table.employeeId),
    statusIdx: index('reimbursements_status_idx').on(table.status),
  })
);

const approvals = pgTable(
  'approvals',
  {
    id: serial('id').primaryKey(),
    reimbursementId: integer('reimbursement_id')
      .references(() => reimbursements.id, { onDelete: 'cascade', onUpdate: 'cascade' })
      .notNull(),
    approverId: integer('approver_id')
      .references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    approverRole: userRoleEnum('approver_role').notNull(),
    decision: approvalDecisionEnum('decision').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => ({
    reimbursementIdIdx: index('approvals_reimbursement_id_idx').on(table.reimbursementId),
    approverIdIdx: index('approvals_approver_id_idx').on(table.approverId),
  })
);

// ── Relations ─────────────────────────────────────────────────────────────────

const usersRelations = relations(users, ({ many, one }) => ({
  reimbursements: many(reimbursements),
  approvals: many(approvals),
  managerAssignment: one(employeeManagers, {
    fields: [users.id],
    references: [employeeManagers.employeeId],
  }),
}));

const employeeManagersRelations = relations(employeeManagers, ({ one }) => ({
  employee: one(users, {
    fields: [employeeManagers.employeeId],
    references: [users.id],
  }),
  manager: one(users, {
    fields: [employeeManagers.managerId],
    references: [users.id],
  }),
}));

const reimbursementsRelations = relations(reimbursements, ({ one, many }) => ({
  employee: one(users, {
    fields: [reimbursements.employeeId],
    references: [users.id],
  }),
  approvals: many(approvals),
}));

const approvalsRelations = relations(approvals, ({ one }) => ({
  reimbursement: one(reimbursements, {
    fields: [approvals.reimbursementId],
    references: [reimbursements.id],
  }),
  approver: one(users, {
    fields: [approvals.approverId],
    references: [users.id],
  }),
}));

module.exports = {
  userRoleEnum,
  reimbursementStatusEnum,
  approvalDecisionEnum,
  users,
  employeeManagers,
  reimbursements,
  approvals,
  usersRelations,
  employeeManagersRelations,
  reimbursementsRelations,
  approvalsRelations,
};
