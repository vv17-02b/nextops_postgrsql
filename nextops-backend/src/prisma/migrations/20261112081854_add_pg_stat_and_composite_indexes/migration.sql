-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- DropIndex
DROP INDEX "ApiHistory_companyId_createdAt_idx";

-- DropIndex
DROP INDEX "Order_companyId_createdAt_idx";

-- DropIndex
DROP INDEX "Review_companyId_createdAt_idx";

-- DropIndex
DROP INDEX "WebhookConfig_companyId_projectId_idx";

-- CreateIndex
CREATE INDEX "ApiHistory_companyId_createdAt_idx" ON "ApiHistory"("companyId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ApiHistory_companyId_statusCode_createdAt_idx" ON "ApiHistory"("companyId", "statusCode", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Order_companyId_createdAt_idx" ON "Order"("companyId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Order_companyId_status_createdAt_idx" ON "Order"("companyId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Order_companyId_paymentStatus_createdAt_idx" ON "Order"("companyId", "paymentStatus", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Product_companyId_isActive_createdAt_idx" ON "Product"("companyId", "isActive", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Product_companyId_categoryId_isActive_idx" ON "Product"("companyId", "categoryId", "isActive");

-- CreateIndex
CREATE INDEX "Review_companyId_productId_createdAt_idx" ON "Review"("companyId", "productId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "WebhookConfig_companyId_projectId_isActive_idx" ON "WebhookConfig"("companyId", "projectId", "isActive");
