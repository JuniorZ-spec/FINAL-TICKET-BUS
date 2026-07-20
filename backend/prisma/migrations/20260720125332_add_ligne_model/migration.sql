-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "ligneId" TEXT;

-- CreateTable
CREATE TABLE "Ligne" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "duration" TEXT,
    "standardPrice" DOUBLE PRECISION NOT NULL,
    "vipPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ligne_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ligne_companyId_idx" ON "Ligne"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Ligne_companyId_code_key" ON "Ligne"("companyId", "code");

-- CreateIndex
CREATE INDEX "Trip_ligneId_idx" ON "Trip"("ligneId");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_ligneId_fkey" FOREIGN KEY ("ligneId") REFERENCES "Ligne"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ligne" ADD CONSTRAINT "Ligne_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
