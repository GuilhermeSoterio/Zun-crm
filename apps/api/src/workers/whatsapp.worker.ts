import { Worker, Job } from 'bullmq'
import { redis } from '../config/redis'
import { prisma } from '../config/database'
import { decrypt } from '../crypto/encrypt'
import { evolutionClient } from '../integrations/evolution/evolution.client'
import { interpolateTemplate, addOptOutFooter } from '../utils/template'

interface WhatsappJobData {
  messageId: string
  clinicId: string
  patientId: string
  campaignPatientId: string
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function humanDelay(): number {
  return Math.floor(Math.random() * 6000) + 2000 // 2-8 segundos
}

function isWithinBusinessHours(date: Date): boolean {
  const hour = date.getHours()
  return hour >= 8 && hour <= 21
}

async function processWhatsappJob(job: Job<WhatsappJobData>) {
  const { messageId, clinicId, patientId, campaignPatientId } = job.data

  // Buscar mensagem, paciente e clínica
  const [message, patient, clinic] = await Promise.all([
    prisma.message.findUnique({
      where: { id: messageId },
      include: { sequence: true },
    }),
    prisma.patient.findUnique({ where: { id: patientId } }),
    prisma.clinic.findUnique({ where: { id: clinicId } }),
  ])

  if (!message || !patient || !clinic) {
    console.error(`[WhatsApp Worker] Dados não encontrados para mensagem ${messageId}`)
    return
  }

  // Verificar opt-out
  if (patient.optedOut) {
    await prisma.message.update({
      where: { id: messageId },
      data: { status: 'SKIPPED' },
    })
    return
  }

  // Verificar horário comercial
  const now = new Date()
  if (!isWithinBusinessHours(now)) {
    const tomorrowMorning = new Date(now)
    tomorrowMorning.setDate(tomorrowMorning.getDate() + 1)
    tomorrowMorning.setHours(9, 0, 0, 0)
    const delayMs = tomorrowMorning.getTime() - now.getTime()
    throw Object.assign(new Error('Fora do horário comercial, reagendando'), { delay: delayMs })
  }

  // Descriptografar dados do paciente
  const patientName = decrypt(patient.nameEncrypted, clinicId)
  const patientPhone = decrypt(patient.phoneEncrypted, clinicId)

  // Interpolar template
  const rawMessage = interpolateTemplate(message.sequence.templateBody, {
    nome_paciente: patientName.split(' ')[0],
    ultimo_procedimento: patient.lastProcedure ?? undefined,
    dias_inativo: patient.inactiveDays ?? undefined,
    nome_clinica: clinic.name,
  })

  const finalMessage = addOptOutFooter(rawMessage)

  // Delay humanizado antes de enviar
  await sleep(humanDelay())

  // Verificar se clínica tem WhatsApp conectado
  if (!clinic.whatsappInstance) {
    throw new Error('Clínica sem instância WhatsApp configurada')
  }

  // Enviar via Evolution API
  const whatsappMessageId = await evolutionClient.sendText(
    clinic.whatsappInstance,
    patientPhone,
    finalMessage
  )

  // Atualizar status no banco
  await prisma.$transaction([
    prisma.message.update({
      where: { id: messageId },
      data: { status: 'SENT', sentAt: new Date(), whatsappMessageId },
    }),
    prisma.campaignPatient.update({
      where: { id: campaignPatientId },
      data: { status: 'IN_PROGRESS', currentStep: message.sequence.stepNumber },
    }),
  ])

  console.log(`[WhatsApp Worker] Mensagem ${messageId} enviada para ${patientPhone.slice(-4)}`)
}

export function startWhatsappWorker() {
  const worker = new Worker<WhatsappJobData>('whatsapp-send', processWhatsappJob, {
    connection: redis,
    concurrency: 50,
  })

  worker.on('failed', (job, err) => {
    console.error(`[WhatsApp Worker] Job ${job?.id} falhou:`, err.message)
    if (job?.data.messageId) {
      prisma.message.update({
        where: { id: job.data.messageId },
        data: { status: 'FAILED', failureReason: err.message },
      }).catch(console.error)
    }
  })

  console.log('[WhatsApp Worker] Iniciado')
  return worker
}
