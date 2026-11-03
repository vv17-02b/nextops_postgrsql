BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Order"
    WHERE "totalAmount" < 0 OR ROUND("totalAmount"::numeric * 100) > 2147483647
  ) OR EXISTS (
    SELECT 1 FROM "OrderItem"
    WHERE "price" < 0 OR ROUND("price"::numeric * 100) > 2147483647
  ) OR EXISTS (
    SELECT 1 FROM "Product"
    WHERE "price" < 0 OR ROUND("price"::numeric * 100) > 2147483647
      OR ("compareAtPrice" IS NOT NULL AND
          ("compareAtPrice" < 0 OR ROUND("compareAtPrice"::numeric * 100) > 2147483647))
  ) THEN
    RAISE EXCEPTION 'Money migration stopped: a legacy amount is negative or exceeds the supported INTEGER minor-unit range.';
  END IF;
END $$;

ALTER TABLE "Order"
  RENAME COLUMN "totalAmount" TO "totalAmountMinor";
ALTER TABLE "Order"
  ALTER COLUMN "totalAmountMinor" TYPE INTEGER
  USING ROUND("totalAmountMinor"::numeric * 100)::INTEGER;

ALTER TABLE "OrderItem"
  RENAME COLUMN "price" TO "priceMinor";
ALTER TABLE "OrderItem"
  ALTER COLUMN "priceMinor" TYPE INTEGER
  USING ROUND("priceMinor"::numeric * 100)::INTEGER;

ALTER TABLE "Product"
  RENAME COLUMN "price" TO "priceMinor";
ALTER TABLE "Product"
  ALTER COLUMN "priceMinor" TYPE INTEGER
  USING ROUND("priceMinor"::numeric * 100)::INTEGER;
ALTER TABLE "Product"
  RENAME COLUMN "compareAtPrice" TO "compareAtPriceMinor";
ALTER TABLE "Product"
  ALTER COLUMN "compareAtPriceMinor" TYPE INTEGER
  USING CASE
    WHEN "compareAtPriceMinor" IS NULL THEN NULL
    ELSE ROUND("compareAtPriceMinor"::numeric * 100)::INTEGER
  END;

DROP INDEX "Category_slug_key";
DROP INDEX "Product_slug_key";
DROP INDEX "Category_companyId_slug_idx";
DROP INDEX "Product_companyId_slug_idx";
CREATE UNIQUE INDEX "Category_companyId_slug_key" ON "Category"("companyId", "slug");
CREATE UNIQUE INDEX "Product_companyId_slug_key" ON "Product"("companyId", "slug");

COMMIT;
