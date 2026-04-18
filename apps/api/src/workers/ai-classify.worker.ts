import { Worker, Job } from 'bullmq'
import { redis } from '../config/redis'
import { prisma } from '../config/database'
import { decrypt } from '../crypto/encrypt'
import { classifyMessage } from '../integrations/claude/classify.prompt'
import { whatsappQueue } from '../queues'

interface AiClassifyJobData {
  messageId: string
  clinicId: string
  campaignPatientId: string
}

async function processAiClassifyJob(job: Job<AiClassifyJobData>) {
  const { messageId, clinicId, campaignPatientId } = job.data

  const message = await prisma.message.findUnique({ where: { id: messageId } })
  if (!message) return

  const messageText = decrypt(message.bodyEncrypted, clinicId)
  const result = await classifyMessage(messageText)

  await prisma.message.update({
    where: { id: messageId },
    data: {
      aiClassification: result.intent,
      aiConfidence: result.confidence,
      aiProcessedAt: new Date(),
    },
  })

  // Se opt_out: processar imediatamente
  if (result.intent === 'opt_out') {
    const campaignPatient = await prisma.campaignPatient.findUnique({
      where: { id: campaignPatientId },
      include: { patient: true },
    })

    if (campaignPatient) {
      await prisma.patient.update({
        where: { id: campaignPatient.patientId },
        data: { optedOut: true, optedOutAt: new Date() },
      })

      // Cancelar jobs pendentes na fila para este paciente
      const pendingMessages = await prisma.message.findMany({
        where: { campaignPatientId, status: 'QUEUED' },
      })

      for (const pending of pendingMessages) {
        const queueJob = await whatsappQueue.getJob(`msg-${pending.id}`)
        await queueJob?.remove()
      }

      await prisma.message.updateMany({
        where: { campaignPatientId, status: 'QUEUED' },
        data: { status: 'SKIPPED' },
      })

      await prisma.campaignPatient.update({
        where: { id: campaignPatientId },
        data: { status: 'OPTED_OUT' },
      })
    }
  }

  // Se interested: notificar (status RESPONDED, conversão manual)
  if (result.intent === 'interested') {
    await prisma.campaignPatient.update({
      where: { id: campaignPatientId },
      data: { status: 'RESPONDED' },
    })
  }

  console.log(`[AI Worker] Mensagem ${messageId} classificada como: ${result.intent} (${Math.round(result.confidence * 100)}%)`)
}

export function startAiClassifyWorker() {
  const worker = new Worker<AiClassifyJobData>('ai-classify', processAiClassifyJob, {
    connection: redis,
    concurrency: 10, // Limitado pelo rate da API Anthropic
  })

  worker.on('failed', (job, err) => {
    console.error(`[AI Worker] Job ${job?.id} falhou:`, err.message)
  })

  console.log('[AI Classify Worker] Iniciado')
  return worker
}
