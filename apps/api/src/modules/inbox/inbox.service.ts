import { prisma } from '../../config/database'
import { encrypt, decrypt, hashPhone } from '../../crypto/encrypt'
import { evolutionClient } from '../../integrations/evolution/evolution.client'

// ─── Inbox (lista de conversas) ───────────────────────────────────────────────

export async function listConversations(clinicId: string) {
  const patients = await prisma.patient.findMany({
    where: {
      clinicId,
      optedOut: false,
      OR: [
        { campaignPatients: { some: { messages: { some: {} } } } },
        { directMessages: { some: {} } },
      ],
    },
    include: {
      campaignPatients: {
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          campaign: { select: { name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 1,
      },
      directMessages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  const conversations = patients.map((p) => {
    const lastCampaignMsg = p.campaignPatients[0]?.messages[0]
    const lastDirectMsg = p.directMessages[0]
    const lastMsg = [lastCampaignMsg, lastDirectMsg]
      .filter(Boolean)
      .sort((a, b) => new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime())[0]

    const unreadCount = p.campaignPatients.reduce((sum, cp) => {
      return sum + cp.messages.filter((m) => m.direction === 'INBOUND' && !m.readAt).length
    }, 0)

    return {
      patientId: p.id,
      name: decrypt(p.nameEncrypted, clinicId),
      phone: decrypt(p.phoneEncrypted, clinicId),
      lastMessage: lastMsg ? {
        body: decrypt(lastMsg.bodyEncrypted, clinicId),
        direction: lastMsg.direction,
        createdAt: lastMsg.createdAt.toISOString(),
        aiClassification: (lastMsg as any).aiClassification ?? null,
      } : null,
      unreadCount,
      campaignName: p.campaignPatients[0]?.campaign?.name ?? null,
      updatedAt: lastMsg?.createdAt.toISOString() ?? p.updatedAt.toISOString(),
    }
  })

  return conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

// ─── Histórico de mensagens de um paciente ────────────────────────────────────

export async function getConversation(clinicId: string, patientId: string) {
  const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId } })
  if (!patient) throw new Error('Paciente não encontrado')

  const [campaignMessages, directMessages] = await Promise.all([
    prisma.message.findMany({
      where: { clinicId, campaignPatient: { patientId } },
      include: { sequence: { select: { stepNumber: true } }, campaignPatient: { select: { campaign: { select: { name: true } } } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.directMessage.findMany({
      where: { clinicId, patientId },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const allMessages = [
    ...campaignMessages.map((m) => ({
      id: m.id,
      type: 'campaign' as const,
      direction: m.direction,
      body: decrypt(m.bodyEncrypted, clinicId),
      status: m.status,
      aiClassification: m.aiClassification,
      aiConfidence: m.aiConfidence,
      campaignName: m.campaignPatient.campaign.name,
      stepNumber: m.sequence.stepNumber,
      createdAt: m.createdAt.toISOString(),
    })),
    ...directMessages.map((m) => ({
      id: m.id,
      type: 'direct' as const,
      direction: m.direction,
      body: decrypt(m.bodyEncrypted, clinicId),
      status: m.status,
      aiClassification: null,
      aiConfidence: null,
      campaignName: null,
      stepNumber: null,
      createdAt: m.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  return {
    patient: {
      id: patient.id,
      name: decrypt(patient.nameEncrypted, clinicId),
      phone: decrypt(patient.phoneEncrypted, clinicId),
      lastProcedure: patient.lastProcedure,
      inactiveDays: patient.inactiveDays,
      optedOut: patient.optedOut,
    },
    messages: allMessages,
  }
}

// ─── Enviar mensagem direta ───────────────────────────────────────────────────

export async function sendDirectMessage(clinicId: string, patientId: string, body: string) {
  const [patient, clinic] = await Promise.all([
    prisma.patient.findFirst({ where: { id: patientId, clinicId } }),
    prisma.clinic.findUnique({ where: { id: clinicId } }),
  ])
  if (!patient) throw new Error('Paciente não encontrado')
  if (!clinic) throw new Error('Clínica não encontrada')
  if (!clinic.whatsappInstance) throw new Error('WhatsApp não configurado')

  const phone = decrypt(patient.phoneEncrypted, clinicId)

  const dm = await prisma.directMessage.create({
    data: {
      clinicId,
      patientId,
      direction: 'OUTBOUND',
      bodyEncrypted: encrypt(body, clinicId),
      status: 'QUEUED',
    },
  })

  try {
    const whatsappMessageId = await evolutionClient.sendText(clinic.whatsappInstance, phone, body)
    await prisma.directMessage.update({
      where: { id: dm.id },
      data: { status: 'SENT', sentAt: new Date(), whatsappMessageId },
    })
    return { id: dm.id, status: 'SENT', whatsappMessageId }
  } catch (err) {
    await prisma.directMessage.update({
      where: { id: dm.id },
      data: { status: 'FAILED', failureReason: String(err) } as any,
    })
    throw err
  }
}

// ─── Quick Replies ────────────────────────────────────────────────────────────

export async function listQuickReplies(clinicId: string) {
  return prisma.quickReply.findMany({ where: { clinicId }, orderBy: { createdAt: 'asc' } })
}

export async function createQuickReply(clinicId: string, data: { title: string; body: string }) {
  return prisma.quickReply.create({ data: { clinicId, ...data } })
}

export async function updateQuickReply(clinicId: string, id: string, data: { title?: string; body?: string }) {
  return prisma.quickReply.updateMany({ where: { id, clinicId }, data })
}

export async function deleteQuickReply(clinicId: string, id: string) {
  return prisma.quickReply.deleteMany({ where: { id, clinicId } })
}

// ─── Receber mensagem inbound (chamado pelo webhook) ──────────────────────────

export async function storeInboundDirectMessage(clinicId: string, patientId: string, body: string) {
  return prisma.directMessage.create({
    data: {
      clinicId,
      patientId,
      direction: 'INBOUND',
      bodyEncrypted: encrypt(body, clinicId),
      status: 'DELIVERED',
      sentAt: new Date(),
      deliveredAt: new Date(),
    },
  })
}
