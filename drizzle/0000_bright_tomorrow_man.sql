CREATE TYPE "public"."user_role" AS ENUM('EMP', 'RM', 'APE', 'CFO');--> statement-breakpoint
CREATE TYPE "public"."reimbursement_status" AS ENUM('PENDING', 'RM_APPROVED', 'APPROVED', 'REJECTED', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."approval_decision" AS ENUM('APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'EMP' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_managers" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"manager_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reimbursements" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"amount" numeric(10, 2) NOT NULL,
	"status" "reimbursement_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"reimbursement_id" integer NOT NULL,
	"approver_id" integer,
	"approver_role" "user_role" NOT NULL,
	"decision" "approval_decision" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee_managers" ADD CONSTRAINT "employee_managers_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "employee_managers" ADD CONSTRAINT "employee_managers_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_reimbursement_id_reimbursements_id_fk" FOREIGN KEY ("reimbursement_id") REFERENCES "public"."reimbursements"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_managers_employee_id_unique_idx" ON "employee_managers" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_managers_manager_id_idx" ON "employee_managers" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "reimbursements_employee_id_idx" ON "reimbursements" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "reimbursements_status_idx" ON "reimbursements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "approvals_reimbursement_id_idx" ON "approvals" USING btree ("reimbursement_id");--> statement-breakpoint
CREATE INDEX "approvals_approver_id_idx" ON "approvals" USING btree ("approver_id");