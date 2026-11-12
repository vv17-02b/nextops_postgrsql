/*
  Warnings:

  - A unique constraint covering the columns `[companyId,provider,providerAccountId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - Made the column `companyId` on table `ApiHistory` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Account_provider_providerAccountId_key";

-- AlterTable
ALTER TABLE "ApiHistory" ALTER COLUMN "companyId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Account_companyId_provider_providerAccountId_key" ON "Account"("companyId", "provider", "providerAccountId");
