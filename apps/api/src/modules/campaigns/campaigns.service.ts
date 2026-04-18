import { Prisma } from '@prisma/client'
import { prisma } from '../../config/database'
import { decrypt } from '../../crypto/encrypt'
import { whatsappQueue } from '../../queues'
import type { CreateCampaignInput } from '@reativa/shared'

export async function createCampaign(clinicId: string, input: CreateCampaignInput) {
  const campaign = await prisma.$transaction(async (tx) => {
    // Criar campanha + sequências
    const c = await tx.campaign.create({
      data: {
        clinicId,
        name: input.name,
        targetFilter: input.targetFilter as unknown as Prisma.InputJsonValue,
        avgTicket: input.avgTicket,
        sequences: {
          create: input.sequences.map((s) => ({
            stepNumber: s.stepNumber,
            delayDays: s.delayDays,
            templateBody: s.templateBody,
          })),
        },
      },
      include: { sequences: true },
    })

    // Carregar tabela de preços da clínica para usar como estimatedValue por procedimento
    const procedurePrices = await tx.procedurePrice.findMany({
      where: { clinicId },
      select: { procedureName: true, price: true },
    })
    const priceMap = new Map(procedurePrices.map((p) => [p.procedureName, p.price]))

    // Buscar pacientes elegíveis
    const patients = await tx.patient.findMany({
      where: {
        clinicId,
        optedOut: false,
        inactiveDays: { gte: input.targetFilter.inactiveDays },
        ...(input.targetFilter.procedures.length > 0
          ? { lastProcedure: { in: input.targetFilter.procedures } }
          : {}),
        ...(input.targetFilter.tags.length > 0
          ? { tags: { hasSome: input.targetFilter.tags } }
          : {}),
      },
      select: { id: true, lastProcedure: true },
    })

    // Criar CampaignPatient + Messages
    for (const patient of patients) {
      // Usar preço do procedimento do paciente se disponível, senão avgTicket da campanha
      const estimatedValue =
        patient.lastProcedure && priceMap.has(patient.lastProcedure)
          ? priceMap.get(patient.lastProcedure)
          : input.avgTicket

      const cp = await tx.campaignPatient.create({
        data: {
          campaignId: c.id,
          patientId: patient.id,
          estimatedValue,
        },
      })

      for (const seq of c.sequences) {
        const delayMs = seq.delayDays * 24 * 60 * 60 * 1000
        const scheduledAt = new Date(Date.now() + delayMs)

        const msg = await tx.message.create({
          data: {
            campaignPatientId: cp.id,
            sequenceId: seq.id,
            clinicId,
            bodyEncrypted: seq.templateBody, // será interpolado no worker
            scheduledAt,
          },
        })

        // Enfileirar na BullMQ com delay
        await whatsappQueue.add(
          'send-message',
          { messageId: msg.id, clinicId, patientId: patient.id, campaignPatientId: cp.id },
          { delay: delayMs, jobId: `msg-${msg.id}` }
        )
      }
    }

    // Ativar campanha
    await tx.campaign.update({
      where: { id: c.id },
      data: { status: 'ACTIVE', startedAt: new Date() },
    })

    return { ...c, patientCount: patients.length }
  })

  return campaign
}

export async function listCampaigns(clinicId: string) {
  const campaigns = await prisma.campaign.findMany({
    where: { clinicId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { campaignPatients: true } },
      campaignPatients: {
        select: { status: true },
      },
    },
  })

  return campaigns.map((c) => {
    const statusCounts = c.campaignPatients.reduce(
      (acc, cp) => {
        acc[cp.status] = (acc[cp.status] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      id: c.id,
      name: c.name,
      status: c.status,
      totalPatients: c._count.campaignPatients,
      pending: statusCounts['PENDING'] ?? 0,
      inProgress: statusCounts['IN_PROGRESS'] ?? 0,
      responded: statusCounts['RESPONDED'] ?? 0,
      converted: statusCounts['CONVERTED'] ?? 0,
      createdAt: c.createdAt,
      startedAt: c.startedAt,
    }
  })
}

export async function previewPatients(clinicId: string, filter: CreateCampaignInput['targetFilter']) {
  return prisma.patient.count({
    where: {
      clinicId,
      optedOut: false,
      inactiveDays: { gte: filter.inactiveDays },
      ...(filter.procedures.length > 0 ? { lastProcedure: { in: filter.procedures } } : {}),
    },
  })
}

export async function listCampaignPatients(clinicId: string, campaignId: string, statusFilter?: string) {
  // Verificar que a campanha pertence à clínica
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, clinicId } })
  if (!campaign) throw new Error('Campanha não encontrada')

  const rows = await prisma.campaignPatient.findMany({
    where: {
      campaignId,
      ...(statusFilter ? { status: statusFilter as any } : {}),
    },
    include: {
      patient: {
        select: {
          nameEncrypted: true,
          phoneEncrypted: true,
          lastAppointmentDate: true,
          lastProcedure: true,
          inactiveDays: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return rows.map((cp) => ({
    id: cp.id,
    patientName: decrypt(cp.patient.nameEncrypted, clinicId),
    phone: decrypt(cp.patient.phoneEncrypted, clinicId),
    lastAppointmentDate: cp.patient.lastAppointmentDate?.toISOString() ?? null,
    lastProcedure: cp.patient.lastProcedure,
    inactiveDays: cp.patient.inactiveDays,
    status: cp.status,
    currentStep: cp.currentStep,
    convertedAt: cp.convertedAt?.toISOString() ?? null,
    estimatedValue: cp.estimatedValue ? Number(cp.estimatedValue) : null,
    actualValue: cp.actualValue ? Number(cp.actualValue) : null,
    convertedNote: cp.convertedNote ?? null,
  }))
}

export async function convertPatient(
  clinicId: string,
  campaignId: string,
  campaignPatientId: string,
  actualValue: number,
  note?: string
) {
  // Verificar que a campanha pertence à clínica
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, clinicId } })
  if (!campaign) throw new Error('Campanha não encontrada')

  const cp = await prisma.campaignPatient.findFirst({
    where: { id: campaignPatientId, campaignId },
  })
  if (!cp) throw new Error('Paciente da campanha não encontrado')

  return prisma.campaignPatient.update({
    where: { id: campaignPatientId },
    data: {
      status: 'CONVERTED',
      convertedAt: new Date(),
      actualValue,
      convertedNote: note ?? null,
    },
    select: {
      id: true,
      status: true,
      convertedAt: true,
      actualValue: true,
      convertedNote: true,
    },
  })
}
