CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AuditLog_companyId_createdAt_idx" ON "AuditLog"("companyId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AuditLog_companyId_entityType_entityId_idx" ON "AuditLog"("companyId", "entityType", "entityId");

GRANT SELECT, INSERT ON TABLE "AuditLog" TO nextops_app;

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON "AuditLog";
CREATE POLICY tenant_isolation_policy ON "AuditLog"
  AS PERMISSIVE
  FOR ALL
  TO nextops_app
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR (
      NULLIF(current_setting('app.current_company_id', true), '') IS NOT NULL
      AND "companyId"::text = current_setting('app.current_company_id', true)
    )
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'true'
    OR (
      NULLIF(current_setting('app.current_company_id', true), '') IS NOT NULL
      AND "companyId"::text = current_setting('app.current_company_id', true)
    )
  );
