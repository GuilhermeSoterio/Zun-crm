import { prisma } from '../../config/database'
import { encrypt, decrypt, hashPhone } from '../../crypto/encrypt'

const DEFAULT_STAGES = [
  { name: 'Novo Lead',   color: '#94a3b8', order: 0, isWon: false, isLost: false },
  { name: 'Em Contato',  color: '#0284c7', order: 1, isWon: false, isLost: false },
  { name: 'Avaliação',   color: '#d97706', order: 2, isWon: false, isLost: false },
  { name: 'Proposta',    color: '#8b5cf6', order: 3, isWon: false, isLost: false },
  { name: 'Fechamento',  color: '#f59e0b', order: 4, isWon: false, isLost: false },
  { name: 'Ganho',       color: '#059669', order: 5, isWon: true,  isLost: false },
  { name: 'Perdido',     color: '#dc2626', order: 6, isWon: false, isLost: true  },
]

export async function createDefaultFunnel(clinicId: string) {
  return prisma.funnel.create({
    data: {
      clinicId,
      name: 'Funil de Vendas',
      color: '#8b5cf6',
      order: 0,
      stages: { create: DEFAULT_STAGES },
    },
    include: { stages: { orderBy: { order: 'asc' } } },
  })
}

// ─── Funnels ──────────────────────────────────────────────────────────────────

export async function listFunnels(clinicId: string) {
  const funnels = await prisma.funnel.findMany({
    where: { clinicId },
    orderBy: { order: 'asc' },
    include: {
      stages: { orderBy: { order: 'asc' } },
      _count: { select: { leads: { where: { status: 'ACTIVE' } } } },
    },
  })

  return funnels.map((f) => ({
    id: f.id,
    name: f.name,
    color: f.color,
    order: f.order,
    totalLeads: f._count.leads,
    stages: f.stages.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      order: s.order,
      isWon: s.isWon,
      isLost: s.isLost,
      leadCount: 0,
    })),
  }))
}

export async function createFunnel(clinicId: string, data: { name: string; color?: string }) {
  const last = await prisma.funnel.findFirst({ where: { clinicId }, orderBy: { order: 'desc' } })
  return prisma.funnel.create({
    data: {
      clinicId,
      name: data.name,
      color: data.color ?? '#8b5cf6',
      order: (last?.order ?? -1) + 1,
      stages: { create: DEFAULT_STAGES },
    },
    include: { stages: { orderBy: { order: 'asc' } } },
  })
}

export async function updateFunnel(clinicId: string, funnelId: string, data: { name?: string; color?: string }) {
  return prisma.funnel.updateMany({
    where: { id: funnelId, clinicId },
    data,
  })
}

export async function deleteFunnel(clinicId: string, funnelId: string) {
  const hasLeads = await prisma.lead.count({ where: { funnelId, clinicId } })
  if (hasLeads > 0) throw new Error('Funil possui leads. Mova ou exclua os leads antes.')
  return prisma.funnel.deleteMany({ where: { id: funnelId, clinicId } })
}

export async function addStage(clinicId: string, funnelId: string, data: { name: string; color?: string }) {
  const funnel = await prisma.funnel.findFirst({ where: { id: funnelId, clinicId } })
  if (!funnel) throw new Error('Funil não encontrado')
  const last = await prisma.funnelStage.findFirst({ where: { funnelId }, orderBy: { order: 'desc' } })
  return prisma.funnelStage.create({
    data: { funnelId, name: data.name, color: data.color ?? '#64748b', order: (last?.order ?? -1) + 1 },
  })
}

export async function updateStage(clinicId: string, funnelId: string, stageId: string, data: { name?: string; color?: string; isWon?: boolean; isLost?: boolean }) {
  const funnel = await prisma.funnel.findFirst({ where: { id: funnelId, clinicId } })
  if (!funnel) throw new Error('Funil não encontrado')
  return prisma.funnelStage.updateMany({ where: { id: stageId, funnelId }, data })
}

export async function deleteStage(clinicId: string, funnelId: string, stageId: string) {
  const funnel = await prisma.funnel.findFirst({ where: { id: funnelId, clinicId } })
  if (!funnel) throw new Error('Funil não encontrado')
  const hasLeads = await prisma.lead.count({ where: { stageId } })
  if (hasLeads > 0) throw new Error('Etapa possui leads. Mova os leads antes.')
  return prisma.funnelStage.deleteMany({ where: { id: stageId, funnelId } })
}

export async function reorderStages(clinicId: string, funnelId: string, stageIds: string[]) {
  const funnel = await prisma.funnel.findFirst({ where: { id: funnelId, clinicId } })
  if (!funnel) throw new Error('Funil não encontrado')
  await Promise.all(
    stageIds.map((id, index) => prisma.funnelStage.updateMany({ where: { id, funnelId }, data: { order: index } }))
  )
}

// ─── Leads ────────────────────────────────────────────────────────────────────

function daysAgo(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / 86_400_000)
}

export async function listLeads(clinicId: string, funnelId: string) {
  const leads = await prisma.lead.findMany({
    where: { clinicId, funnelId, status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
  })

  return leads.map((l) => ({
    id: l.id,
    name: decrypt(l.nameEncrypted, clinicId),
    phone: l.phoneEncrypted ? decrypt(l.phoneEncrypted, clinicId) : null,
    email: l.email,
    source: l.source,
    estimatedValue: l.estimatedValue ? Number(l.estimatedValue) : null,
    status: l.status as 'ACTIVE' | 'WON' | 'LOST',
    stageId: l.stageId,
    funnelId: l.funnelId,
    daysInStage: daysAgo(l.updatedAt),
    createdAt: l.createdAt.toISOString(),
  }))
}

export async function getLead(clinicId: string, leadId: string) {
  const l = await prisma.lead.findFirst({
    where: { id: leadId, clinicId },
    include: { activities: { orderBy: { createdAt: 'desc' } } },
  })
  if (!l) throw new Error('Lead não encontrado')

  return {
    id: l.id,
    name: decrypt(l.nameEncrypted, clinicId),
    phone: l.phoneEncrypted ? decrypt(l.phoneEncrypted, clinicId) : null,
    email: l.email,
    source: l.source,
    notes: l.notes,
    estimatedValue: l.estimatedValue ? Number(l.estimatedValue) : null,
    status: l.status as 'ACTIVE' | 'WON' | 'LOST',
    stageId: l.stageId,
    funnelId: l.funnelId,
    daysInStage: daysAgo(l.updatedAt),
    wonAt: l.wonAt?.toISOString() ?? null,
    lostAt: l.lostAt?.toISOString() ?? null,
    lostReason: l.lostReason,
    patientId: l.patientId,
    createdAt: l.createdAt.toISOString(),
    activities: l.activities.map((a) => ({
      id: a.id,
      type: a.type,
      data: a.data as Record<string, unknown> | null,
      createdAt: a.createdAt.toISOString(),
    })),
  }
}

export async function createLead(clinicId: string, data: {
  funnelId: string
  stageId?: string
  name: string
  phone?: string
  email?: string
  source?: string
  notes?: string
  estimatedValue?: number
}) {
  const funnel = await prisma.funnel.findFirst({
    where: { id: data.funnelId, clinicId },
    include: { stages: { orderBy: { order: 'asc' }, take: 1 } },
  })
  if (!funnel) throw new Error('Funil não encontrado')

  const stageId = data.stageId ?? funnel.stages[0]?.id
  if (!stageId) throw new Error('Funil sem etapas')

  const lead = await prisma.lead.create({
    data: {
      clinicId,
      funnelId: data.funnelId,
      stageId,
      nameEncrypted: encrypt(data.name, clinicId),
      phoneEncrypted: data.phone ? encrypt(data.phone, clinicId) : null,
      phoneHash: data.phone ? hashPhone(data.phone) : null,
      email: data.email,
      source: data.source ?? 'manual',
      notes: data.notes,
      estimatedValue: data.estimatedValue,
    },
  })

  await prisma.leadActivity.create({
    data: { leadId: lead.id, type: 'created', data: { stageName: funnel.stages[0]?.name } },
  })

  return lead
}

export async function updateLead(clinicId: string, leadId: string, data: {
  name?: string
  phone?: string
  email?: string
  source?: string
  notes?: string
  estimatedValue?: number
}) {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, clinicId } })
  if (!lead) throw new Error('Lead não encontrado')

  return prisma.lead.update({
    where: { id: leadId },
    data: {
      ...(data.name && { nameEncrypted: encrypt(data.name, clinicId) }),
      ...(data.phone && { phoneEncrypted: encrypt(data.phone, clinicId), phoneHash: hashPhone(data.phone) }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.source !== undefined && { source: data.source }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.estimatedValue !== undefined && { estimatedValue: data.estimatedValue }),
    },
  })
}

export async function moveLead(clinicId: string, leadId: string, stageId: string) {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, clinicId }, include: { stage: true } })
  if (!lead) throw new Error('Lead não encontrado')

  const newStage = await prisma.funnelStage.findFirst({ where: { id: stageId, funnelId: lead.funnelId } })
  if (!newStage) throw new Error('Etapa não encontrada')

  const fromStageName = lead.stage.name

  await prisma.lead.update({ where: { id: leadId }, data: { stageId, updatedAt: new Date() } })
  await prisma.leadActivity.create({
    data: {
      leadId,
      type: 'stage_change',
      data: { fromStage: fromStageName, toStage: newStage.name },
    },
  })
}

export async function winLead(clinicId: string, leadId: string, data: { actualValue?: number; createPatient?: boolean }) {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, clinicId } })
  if (!lead) throw new Error('Lead não encontrado')

  const stage = await prisma.funnelStage.findFirst({ where: { funnelId: lead.funnelId, isWon: true } })

  let patientId = lead.patientId

  if (data.createPatient && !patientId) {
    const phone = lead.phoneEncrypted ? undefined : `lead_${lead.id}`
    const patient = await prisma.patient.create({
      data: {
        clinicId,
        nameEncrypted: lead.nameEncrypted,
        phoneEncrypted: lead.phoneEncrypted ?? encrypt(phone!, clinicId),
        phoneHash: lead.phoneHash ?? hashPhone(phone!),
        source: 'lead_conversion',
      },
    })
    patientId = patient.id
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: 'WON',
      wonAt: new Date(),
      stageId: stage?.id ?? lead.stageId,
      estimatedValue: data.actualValue ?? lead.estimatedValue,
      patientId,
    },
  })

  await prisma.leadActivity.create({
    data: { leadId, type: 'won', data: { actualValue: data.actualValue, patientCreated: !!patientId } },
  })

  return { patientId }
}

export async function loseLead(clinicId: string, leadId: string, reason?: string) {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, clinicId } })
  if (!lead) throw new Error('Lead não encontrado')

  const stage = await prisma.funnelStage.findFirst({ where: { funnelId: lead.funnelId, isLost: true } })

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: 'LOST',
      lostAt: new Date(),
      lostReason: reason,
      stageId: stage?.id ?? lead.stageId,
    },
  })

  await prisma.leadActivity.create({
    data: { leadId, type: 'lost', data: { reason } },
  })
}

export async function deleteLead(clinicId: string, leadId: string) {
  return prisma.lead.deleteMany({ where: { id: leadId, clinicId } })
}
