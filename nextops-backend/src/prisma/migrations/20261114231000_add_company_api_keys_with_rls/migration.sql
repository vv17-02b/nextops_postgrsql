-- CreateTable
CREATE TABLE "CompanyApiKey" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY['read:products', 'write:orders']::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyApiKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CompanyApiKey_keyHash_key" ON "CompanyApiKey"("keyHash");
CREATE UNIQUE INDEX "CompanyApiKey_id_companyId_key" ON "CompanyApiKey"("id", "companyId");
CREATE INDEX "CompanyApiKey_companyId_idx" ON "CompanyApiKey"("companyId");
CREATE INDEX "CompanyApiKey_keyHash_idx" ON "CompanyApiKey"("keyHash");

ALTER TABLE "CompanyApiKey" ADD CONSTRAINT "CompanyApiKey_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CompanyApiKey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompanyApiKey" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON "CompanyApiKey";
CREATE POLICY tenant_isolation_policy ON "CompanyApiKey"
    USING (current_setting('app.bypass_rls', true) = 'true' OR "companyId" = NULLIF(current_setting('app.current_company_id', true), ''))
    WITH CHECK (current_setting('app.bypass_rls', true) = 'true' OR "companyId" = NULLIF(current_setting('app.current_company_id', true), ''));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nextops_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "CompanyApiKey" TO nextops_app;
  END IF;
END
$$;
