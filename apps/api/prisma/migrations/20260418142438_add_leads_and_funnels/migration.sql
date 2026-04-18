-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('ACTIVE', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "funnels" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#8b5cf6',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funnels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funnel_stages" (
    "id" TEXT NOT NULL,
    "funnelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#64748b',
    "order" INTEGER NOT NULL,
    "isWon" BOOLEAN NOT NULL DEFAULT false,
    "isLost" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "funnel_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "funnelId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "nameEncrypted" TEXT NOT NULL,
    "phoneEncrypted" TEXT,
    "phoneHash" TEXT,
    "email" TEXT,
    "source" TEXT,
    "notes" TEXT,
    "estimatedValue" DECIMAL(10,2),
    "status" "LeadStatus" NOT NULL DEFAULT 'ACTIVE',
    "wonAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "patientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "funnels_clinicId_idx" ON "funnels"("clinicId");

-- CreateIndex
CREATE INDEX "funnel_stages_funnelId_idx" ON "funnel_stages"("funnelId");

-- CreateIndex
CREATE UNIQUE INDEX "leads_patientId_key" ON "leads"("patientId");

-- CreateIndex
CREATE INDEX "leads_clinicId_idx" ON "leads"("clinicId");

-- CreateIndex
CREATE INDEX "leads_funnelId_idx" ON "leads"("funnelId");

-- CreateIndex
CREATE INDEX "leads_stageId_idx" ON "leads"("stageId");

-- CreateIndex
CREATE INDEX "lead_activities_leadId_idx" ON "lead_activities"("leadId");

-- AddForeignKey
ALTER TABLE "funnels" ADD CONSTRAINT "funnels_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funnel_stages" ADD CONSTRAINT "funnel_stages_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "funnels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "funnel_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
