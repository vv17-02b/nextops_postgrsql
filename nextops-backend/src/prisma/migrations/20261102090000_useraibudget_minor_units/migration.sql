-- Converts UserAiBudget money-like fields from floating point to integer minor units.
-- Fails closed on NULL/overflow/non-integer-cent values so bad legacy data stops the migration.

-- 1) Add new integer columns.
ALTER TABLE "UserAiBudget" ADD COLUMN "monthlyLimitMinor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserAiBudget" ADD COLUMN "currentUsageMinor" INTEGER NOT NULL DEFAULT 0;

-- 2) Convert legacy float values to minor units. Abort on any value that cannot be
--    represented exactly as whole cents within INTEGER range (fail-closed).
UPDATE "UserAiBudget"
SET "monthlyLimitMinor" = ("monthlyLimit" * 100)::integer,
    "currentUsageMinor" = ("currentUsage" * 100)::integer
WHERE "monthlyLimit" IS NOT NULL
  AND "currentUsage" IS NOT NULL
  AND "monthlyLimit" * 100 = floor("monthlyLimit" * 100)
  AND "currentUsage" * 100 = floor("currentUsage" * 100)
  AND "monthlyLimit" * 100 BETWEEN -2147483648 AND 2147483647
  AND "currentUsage" * 100 BETWEEN -2147483648 AND 2147483647;

-- Fail the migration if any row was skipped by the guarded UPDATE above.
DO $$
DECLARE
  mismatch_count integer;
BEGIN
  SELECT count(*) INTO mismatch_count
  FROM "UserAiBudget"
  WHERE ("monthlyLimit" * 100)::integer <> "monthlyLimitMinor"
     OR ("currentUsage" * 100)::integer <> "currentUsageMinor";
  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'UserAiBudget minor-unit migration aborted: % row(s) hold float values that are not exact whole cents or are out of INTEGER range. Backfill/correct legacy data before migrating.', mismatch_count;
  END IF;
END $$;



-- 3) Swap columns (old floats out, new integers renamed in).
ALTER TABLE "UserAiBudget" DROP COLUMN "monthlyLimit";
ALTER TABLE "UserAiBudget" DROP COLUMN "currentUsage";
ALTER TABLE "UserAiBudget" RENAME COLUMN "monthlyLimitMinor" TO "monthlyLimit_x";
ALTER TABLE "UserAiBudget" RENAME COLUMN "currentUsageMinor" TO "currentUsage_x";
ALTER TABLE "UserAiBudget" RENAME COLUMN "monthlyLimit_x" TO "monthlyLimitMinor";
ALTER TABLE "UserAiBudget" RENAME COLUMN "currentUsage_x" TO "currentUsageMinor";
