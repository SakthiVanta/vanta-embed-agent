-- Add Stripe billing fields to workspaces table
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" TEXT;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "subscription_status" TEXT NOT NULL DEFAULT 'INCOMPLETE';
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "current_period_start" TIMESTAMP(3);
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "current_period_end" TIMESTAMP(3);
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false;

-- Add unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "workspaces_stripe_customer_id_key" ON "workspaces"("stripe_customer_id");
CREATE UNIQUE INDEX IF NOT EXISTS "workspaces_stripe_subscription_id_key" ON "workspaces"("stripe_subscription_id");

-- Create enum type for subscription status if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscriptionstatus') THEN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('INCOMPLETE', 'INCOMPLETE_EXPIRED', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'PAUSED');
  END IF;
END $$;

-- Create payments table
CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "payments_stripe_payment_intent_id_key" ON "payments"("stripe_payment_intent_id");
CREATE INDEX IF NOT EXISTS "payments_workspace_id_created_at_idx" ON "payments"("workspace_id", "created_at");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");

-- Create invoices table
CREATE TABLE IF NOT EXISTS "invoices" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "stripe_invoice_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT NOT NULL,
    "stripe_subscription_id" TEXT,
    "amount_due" INTEGER NOT NULL,
    "amount_paid" INTEGER NOT NULL,
    "amount_remaining" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL,
    "pdf_url" TEXT,
    "hosted_invoice_url" TEXT,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "invoices_stripe_invoice_id_key" ON "invoices"("stripe_invoice_id");
CREATE INDEX IF NOT EXISTS "invoices_workspace_id_created_at_idx" ON "invoices"("workspace_id", "created_at");
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices"("status");

-- Add foreign keys
ALTER TABLE "payments" ADD CONSTRAINT "payments_workspace_id_fkey" 
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_workspace_id_fkey" 
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add new audit actions to enum
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_CANCELLED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PAYMENT_SUCCEEDED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PAYMENT_FAILED';
