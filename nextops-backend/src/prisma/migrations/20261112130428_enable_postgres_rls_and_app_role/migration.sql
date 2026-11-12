-- 1. Create restricted application role (no SUPERUSER, no BYPASSRLS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nextops_app') THEN
    CREATE ROLE nextops_app LOGIN PASSWORD 'nextops_app_local_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  ELSE
    ALTER ROLE nextops_app NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END
$$;

-- 2. Grant schema and table privileges to nextops_app
GRANT USAGE ON SCHEMA public TO nextops_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nextops_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nextops_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nextops_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO nextops_app;

-- 3. Enable and FORCE Row-Level Security on all 16 tenant-scoped tables
DO $$
DECLARE
  tbl text;
  tenant_tables text[] := ARRAY[
    'Account',
    'AgentKnowledgeBase',
    'ApiHistory',
    'Category',
    'Invitation',
    'Order',
    'OrderItem',
    'Product',
    'Project',
    'Review',
    'Session',
    'User',
    'UserAiBudget',
    'VerificationToken',
    'Warehouse',
    'WebhookConfig'
  ];
BEGIN
  FOREACH tbl IN ARRAY tenant_tables
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation_policy ON %I
         AS PERMISSIVE
         FOR ALL
         TO nextops_app
         USING (
           current_setting(''app.bypass_rls'', true) = ''true''
           OR (
             NULLIF(current_setting(''app.current_company_id'', true), '''') IS NOT NULL
             AND "companyId"::text = current_setting(''app.current_company_id'', true)
           )
         )
         WITH CHECK (
           current_setting(''app.bypass_rls'', true) = ''true''
           OR (
             NULLIF(current_setting(''app.current_company_id'', true), '''') IS NOT NULL
             AND "companyId"::text = current_setting(''app.current_company_id'', true)
           )
         );',
      tbl
    );
  END LOOP;
END
$$;
