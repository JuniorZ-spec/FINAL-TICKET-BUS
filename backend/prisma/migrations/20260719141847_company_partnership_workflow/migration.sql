/*
  Warnings:

  - You are about to drop the column `isBlocked` on the `Company` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED', 'REJECTED');

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "isBlocked",
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "ifu" TEXT,
ADD COLUMN     "rccm" TEXT,
ADD COLUMN     "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "routesNote" TEXT,
ADD COLUMN     "status" "CompanyStatus" NOT NULL DEFAULT 'VERIFIED';
