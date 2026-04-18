-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('TRIAL', 'STARTER', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CampaignPatientStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESPONDED', 'CONVERTED', 'OPTED_OUT', 'FAILED');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('OUTBOUND', 'INBOUND');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "clinics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "cnpj" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'TRIAL',
    "avgTicket" DECIMAL(10,2),
    "whatsappInstance" TEXT,
    "whatsappConnected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "nameEncrypted" TEXT NOT NULL,
    "phoneEncrypted" TEXT NOT NULL,
    "phoneHash" TEXT NOT NULL,
    "lastAppointmentDate" TIMESTAMP(3),
    "lastProcedure" TEXT,
    "inactiveDays" INTEGER,
    "optedOut" BOOLEAN NOT NULL DEFAULT false,
    "optedOutAt" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'csv_import',
    "externalId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "targetFilter" JSONB NOT NULL,
    "avgTicket" DECIMAL(10,2),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_sequences" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "delayDays" INTEGER NOT NULL,
    "templateBody" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_patients" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "status" "CampaignPatientStatus" NOT NULL DEFAULT 'PENDING',
    "convertedAt" TIMESTAMP(3),
    "estimatedValue" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "campaignPatientId" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "direction" "Direction" NOT NULL DEFAULT 'OUTBOUND',
    "bodyEncrypted" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'QUEUED',
    "whatsappMessageId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "aiClassification" TEXT,
    "aiConfidence" DOUBLE PRECISION,
    "aiProcessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "totalRows" INTEGER,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "fieldMapping" JSONB NOT NULL,
    "errorLog" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clinics_email_key" ON "clinics"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clinics_cnpj_key" ON "clinics"("cnpj");

-- CreateIndex
CREATE INDEX "patients_clinicId_idx" ON "patients"("clinicId");

-- CreateIndex
CREATE INDEX "patients_clinicId_optedOut_idx" ON "patients"("clinicId", "optedOut");

-- CreateIndex
CREATE UNIQUE INDEX "patients_clinicId_phoneHash_key" ON "patients"("clinicId", "phoneHash");

-- CreateIndex
CREATE INDEX "campaigns_clinicId_status_idx" ON "campaigns"("clinicId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "message_sequences_campaignId_stepNumber_key" ON "message_sequences"("campaignId", "stepNumber");

-- CreateIndex
CREATE INDEX "campaign_patients_campaignId_status_idx" ON "campaign_patients"("campaignId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_patients_campaignId_patientId_key" ON "campaign_patients"("campaignId", "patientId");

-- CreateIndex
CREATE INDEX "messages_clinicId_status_idx" ON "messages"("clinicId", "status");

-- CreateIndex
CREATE INDEX "messages_scheduledAt_status_idx" ON "messages"("scheduledAt", "status");

-- CreateIndex
CREATE INDEX "messages_whatsappMessageId_idx" ON "messages"("whatsappMessageId");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_sequences" ADD CONSTRAINT "message_sequences_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_patients" ADD CONSTRAINT "campaign_patients_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_patients" ADD CONSTRAINT "campaign_patients_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_campaignPatientId_fkey" FOREIGN KEY ("campaignPatientId") REFERENCES "campaign_patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "message_sequences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
