-- AlterTable
ALTER TABLE "campaign_patients" ADD COLUMN     "actualValue" DECIMAL(10,2),
ADD COLUMN     "convertedNote" TEXT;

-- CreateTable
CREATE TABLE "procedure_prices" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "procedureName" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procedure_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "procedure_prices_clinicId_procedureName_key" ON "procedure_prices"("clinicId", "procedureName");

-- AddForeignKey
ALTER TABLE "procedure_prices" ADD CONSTRAINT "procedure_prices_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
