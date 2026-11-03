BEGIN;

DO $$
DECLARE
  unassigned_count BIGINT;
BEGIN
  SELECT
    (SELECT COUNT(*) FROM "Account" WHERE "companyId" IS NULL)
    + (SELECT COUNT(*) FROM "AgentKnowledgeBase" WHERE "companyId" IS NULL)
    + (SELECT COUNT(*) FROM "Category" WHERE "companyId" IS NULL)
    + (SELECT COUNT(*) FROM "Order" WHERE "companyId" IS NULL)
    + (SELECT COUNT(*) FROM "OrderItem" WHERE "companyId" IS NULL)
    + (SELECT COUNT(*) FROM "Product" WHERE "companyId" IS NULL)
    + (SELECT COUNT(*) FROM "Project" WHERE "companyId" IS NULL)
    + (SELECT COUNT(*) FROM "Review" WHERE "companyId" IS NULL)
    + (SELECT COUNT(*) FROM "Session" WHERE "companyId" IS NULL)
    + (SELECT COUNT(*) FROM "User" WHERE "companyId" IS NULL)
    + (SELECT COUNT(*) FROM "UserAiBudget" WHERE "companyId" IS NULL)
    + (SELECT COUNT(*) FROM "VerificationToken" WHERE "companyId" IS NULL)
    + (SELECT COUNT(*) FROM "Warehouse" WHERE "companyId" IS NULL)
    + (SELECT COUNT(*) FROM "WebhookConfig" WHERE "companyId" IS NULL)
  INTO unassigned_count;

  IF unassigned_count > 0 THEN
    RAISE EXCEPTION 'SaaS tenant migration stopped: % legacy rows have no companyId. Backfill ownership from verified records and rerun; no default tenant was assigned.', unassigned_count;
  END IF;
END $$;

UPDATE "User" SET "role" = 'MEMBER' WHERE "role" = 'USER';
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'MEMBER';

CREATE TABLE "Invitation" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'MEMBER',
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Account" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "AgentKnowledgeBase" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Project" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Review" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Session" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "UserAiBudget" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "VerificationToken" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Warehouse" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "WebhookConfig" ALTER COLUMN "companyId" SET NOT NULL;

CREATE UNIQUE INDEX "Account_id_companyId_key" ON "Account"("id", "companyId");
CREATE UNIQUE INDEX "AgentKnowledgeBase_id_companyId_key" ON "AgentKnowledgeBase"("id", "companyId");
CREATE UNIQUE INDEX "ApiHistory_id_companyId_key" ON "ApiHistory"("id", "companyId");
CREATE UNIQUE INDEX "Category_id_companyId_key" ON "Category"("id", "companyId");
CREATE UNIQUE INDEX "Order_id_companyId_key" ON "Order"("id", "companyId");
CREATE UNIQUE INDEX "OrderItem_id_companyId_key" ON "OrderItem"("id", "companyId");
CREATE UNIQUE INDEX "Product_id_companyId_key" ON "Product"("id", "companyId");
CREATE UNIQUE INDEX "Project_id_companyId_key" ON "Project"("id", "companyId");
CREATE UNIQUE INDEX "Review_id_companyId_key" ON "Review"("id", "companyId");
CREATE UNIQUE INDEX "Session_id_companyId_key" ON "Session"("id", "companyId");
CREATE UNIQUE INDEX "User_id_companyId_key" ON "User"("id", "companyId");
CREATE UNIQUE INDEX "UserAiBudget_id_companyId_key" ON "UserAiBudget"("id", "companyId");
CREATE UNIQUE INDEX "VerificationToken_id_companyId_key" ON "VerificationToken"("id", "companyId");
CREATE UNIQUE INDEX "Warehouse_id_companyId_key" ON "Warehouse"("id", "companyId");
CREATE UNIQUE INDEX "WebhookConfig_id_companyId_key" ON "WebhookConfig"("id", "companyId");

CREATE INDEX "Account_companyId_userId_idx" ON "Account"("companyId", "userId");
CREATE INDEX "AgentKnowledgeBase_companyId_projectId_idx" ON "AgentKnowledgeBase"("companyId", "projectId");
CREATE INDEX "ApiHistory_companyId_createdAt_idx" ON "ApiHistory"("companyId", "createdAt");
CREATE INDEX "Category_companyId_slug_idx" ON "Category"("companyId", "slug");
CREATE INDEX "Order_companyId_createdAt_idx" ON "Order"("companyId", "createdAt");
CREATE INDEX "OrderItem_companyId_orderId_idx" ON "OrderItem"("companyId", "orderId");
CREATE INDEX "OrderItem_companyId_productId_idx" ON "OrderItem"("companyId", "productId");
CREATE INDEX "Product_companyId_slug_idx" ON "Product"("companyId", "slug");
CREATE INDEX "Project_companyId_userId_idx" ON "Project"("companyId", "userId");
CREATE INDEX "Review_companyId_createdAt_idx" ON "Review"("companyId", "createdAt");
CREATE INDEX "Session_companyId_userId_idx" ON "Session"("companyId", "userId");
CREATE INDEX "User_companyId_createdAt_idx" ON "User"("companyId", "createdAt");
CREATE INDEX "UserAiBudget_companyId_userId_idx" ON "UserAiBudget"("companyId", "userId");
CREATE INDEX "VerificationToken_companyId_expires_idx" ON "VerificationToken"("companyId", "expires");
CREATE INDEX "Warehouse_companyId_productId_idx" ON "Warehouse"("companyId", "productId");
CREATE INDEX "WebhookConfig_companyId_projectId_idx" ON "WebhookConfig"("companyId", "projectId");

CREATE UNIQUE INDEX "Invitation_id_companyId_key" ON "Invitation"("id", "companyId");
CREATE UNIQUE INDEX "Invitation_companyId_email_key" ON "Invitation"("companyId", "email");
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");
CREATE INDEX "Invitation_companyId_expiresAt_idx" ON "Invitation"("companyId", "expiresAt");
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_companyId_fkey"
  FOREIGN KEY ("userId", "companyId") REFERENCES "User"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentKnowledgeBase" ADD CONSTRAINT "AgentKnowledgeBase_projectId_companyId_fkey"
  FOREIGN KEY ("projectId", "companyId") REFERENCES "Project"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApiHistory" ADD CONSTRAINT "ApiHistory_userId_companyId_fkey"
  FOREIGN KEY ("userId", "companyId") REFERENCES "User"("id", "companyId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_companyId_fkey"
  FOREIGN KEY ("parentId", "companyId") REFERENCES "Category"("id", "companyId") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_companyId_fkey"
  FOREIGN KEY ("userId", "companyId") REFERENCES "User"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_companyId_fkey"
  FOREIGN KEY ("orderId", "companyId") REFERENCES "Order"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_companyId_fkey"
  FOREIGN KEY ("productId", "companyId") REFERENCES "Product"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_companyId_fkey"
  FOREIGN KEY ("categoryId", "companyId") REFERENCES "Category"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_companyId_fkey"
  FOREIGN KEY ("userId", "companyId") REFERENCES "User"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_companyId_fkey"
  FOREIGN KEY ("userId", "companyId") REFERENCES "User"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_companyId_fkey"
  FOREIGN KEY ("productId", "companyId") REFERENCES "Product"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_companyId_fkey"
  FOREIGN KEY ("userId", "companyId") REFERENCES "User"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAiBudget" ADD CONSTRAINT "UserAiBudget_userId_companyId_fkey"
  FOREIGN KEY ("userId", "companyId") REFERENCES "User"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAiBudget" ADD CONSTRAINT "UserAiBudget_projectId_companyId_fkey"
  FOREIGN KEY ("projectId", "companyId") REFERENCES "Project"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_productId_companyId_fkey"
  FOREIGN KEY ("productId", "companyId") REFERENCES "Product"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebhookConfig" ADD CONSTRAINT "WebhookConfig_projectId_companyId_fkey"
  FOREIGN KEY ("projectId", "companyId") REFERENCES "Project"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
