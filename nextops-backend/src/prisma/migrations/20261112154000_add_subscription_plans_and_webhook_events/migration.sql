CREATE TABLE IF NOT EXISTS "Plan" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "maxUsers" INTEGER NOT NULL,
    "maxProducts" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Plan_pkey" PRIMARY KEY ("code")
);

INSERT INTO "Plan" ("code", "name", "priceMinor", "currency", "maxUsers", "maxProducts")
VALUES
  ('FREE', 'Starter Free', 0, 'USD', 3, 50),
  ('PRO', 'Pro Growth', 2900, 'USD', 25, 5000),
  ('ENTERPRISE', 'Enterprise Unlimited', 9900, 'USD', 10000, 1000000)
ON CONFLICT ("code") DO NOTHING;

CREATE TABLE IF NOT EXISTS "ProcessedWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessedWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProcessedWebhookEvent_provider_processedAt_idx" ON "ProcessedWebhookEvent"("provider", "processedAt" DESC);

ALTER TABLE "Company"
  ADD COLUMN IF NOT EXISTS "planCode" TEXT NOT NULL DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT NOT NULL DEFAULT 'TRIALING',
  ADD COLUMN IF NOT EXISTS "billingCustomerId" TEXT,
  ADD COLUMN IF NOT EXISTS "billingSubscriptionId" TEXT,
  ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Company_billingCustomerId_key" ON "Company"("billingCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Company_billingSubscriptionId_key" ON "Company"("billingSubscriptionId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Company_planCode_fkey') THEN
    ALTER TABLE "Company" ADD CONSTRAINT "Company_planCode_fkey" FOREIGN KEY ("planCode") REFERENCES "Plan"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;

GRANT SELECT ON TABLE "Plan" TO nextops_app;
GRANT SELECT, INSERT ON TABLE "ProcessedWebhookEvent" TO nextops_app;
