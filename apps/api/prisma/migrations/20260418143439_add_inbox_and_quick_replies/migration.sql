-- CreateTable
CREATE TABLE "direct_messages" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT,
    "direction" "Direction" NOT NULL DEFAULT 'OUTBOUND',
    "bodyEncrypted" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'QUEUED',
    "whatsappMessageId" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quick_replies" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quick_replies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "direct_messages_clinicId_idx" ON "direct_messages"("clinicId");

-- CreateIndex
CREATE INDEX "direct_messages_patientId_idx" ON "direct_messages"("patientId");

-- CreateIndex
CREATE INDEX "direct_messages_clinicId_patientId_createdAt_idx" ON "direct_messages"("clinicId", "patientId", "createdAt");

-- CreateIndex
CREATE INDEX "quick_replies_clinicId_idx" ON "quick_replies"("clinicId");

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quick_replies" ADD CONSTRAINT "quick_replies_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
