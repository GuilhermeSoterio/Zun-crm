import { FastifyInstance } from 'fastify'
import { prisma } from '../../config/database'
import { aiClassifyQueue, whatsappQueue } from '../../queues'
import { encrypt } from '../../crypto/encrypt'
import { storeInboundDirectMessage } from '../inbox/inbox.service'

interface EvolutionWebhookBody {
  event: string
  instance: string
  data: {
    key?: { id: string; remoteJid: string; fromMe: boolean }
    message?: { conversation?: string; extendedTextMessage?: { text: string } }
    update?: { status: string }
    status?: string
  }
}

async function findClinicByInstance(instanceId: string) {
  return prisma.clinic.findFirst({ where: { whatsappInstance: instanceId } })
}

export async function webhookRoutes(app: FastifyInstance) {
  app.post('/webhooks/evolution', async (request, reply) => {
    const body = request.body as EvolutionWebhookBody

    reply.status(200).send({ ok: true }) // Responde imediatamente

    const clinic = await findClinicByInstance(body.instance)
    if (!clinic) return

    // Mensagem recebida (resposta do paciente)
    if (body.event === 'messages.upsert' && body.data.key && !body.data.key.fromMe) {
      const phone = body.data.key.remoteJid.replace('@s.whatsapp.net', '')
      const text = body.data.message?.conversation || body.data.message?.extendedTextMessage?.text || ''

      if (!text) return

      // Encontrar paciente pelo telefone (busca por hash)
      const { hashPhone } = await import('../../crypto/encrypt')
      const patient = await prisma.patient.findUnique({
        where: { clinicId_phoneHash: { clinicId: clinic.id, phoneHash: hashPhone(phone) } },
      })

      if (!patient) return

      // Encontrar campanha ativa para este paciente
      const campaignPatient = await prisma.campaignPatient.findFirst({
        where: {
          patientId: patient.id,
          status: { in: ['IN_PROGRESS', 'PENDING'] },
          campaign: { status: 'ACTIVE' },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (!campaignPatient) {
        // Paciente fora de campanha ativa → salvar como mensagem direta no inbox
        await storeInboundDirectMessage(clinic.id, patient.id, text)
        return
      }

      // Criar mensagem INBOUND
      const inboundMessage = await prisma.message.create({
        data: {
          campaignPatientId: campaignPatient.id,
          sequenceId: (await prisma.message.findFirst({
            where: { campaignPatientId: campaignPatient.id, direction: 'OUTBOUND' },
            orderBy: { createdAt: 'desc' },
          }))!.sequenceId,
          clinicId: clinic.id,
          direction: 'INBOUND',
          bodyEncrypted: encrypt(text, clinic.id),
          status: 'DELIVERED',
          scheduledAt: new Date(),
          sentAt: new Date(),
        },
      })

      // Atualizar status do CampaignPatient
      await prisma.campaignPatient.update({
        where: { id: campaignPatient.id },
        data: { status: 'RESPONDED' },
      })

      // Cancelar próximos envios agendados
      const pendingMessages = await prisma.message.findMany({
        where: { campaignPatientId: campaignPatient.id, status: 'QUEUED' },
      })

      for (const pending of pendingMessages) {
        const job = await whatsappQueue.getJob(`msg-${pending.id}`)
        await job?.remove()
      }

      await prisma.message.updateMany({
        where: { campaignPatientId: campaignPatient.id, status: 'QUEUED' },
        data: { status: 'SKIPPED' },
      })

      // Enfileirar classificação por IA
      await aiClassifyQueue.add('classify', {
        messageId: inboundMessage.id,
        clinicId: clinic.id,
        campaignPatientId: campaignPatient.id,
      })
    }

    // ACK de entrega/leitura
    if (body.event === 'messages.update' && body.data.key?.id) {
      const whatsappMessageId = body.data.key.id
      const status = body.data.update?.status || body.data.status

      const updateData: Record<string, unknown> = {}
      if (status === 'DELIVERY_ACK' || status === '3') {
        updateData.status = 'DELIVERED'
        updateData.deliveredAt = new Date()
      } else if (status === 'READ' || status === '4') {
        updateData.status = 'READ'
        updateData.readAt = new Date()
      }

      if (Object.keys(updateData).length > 0) {
        await Promise.all([
          prisma.message.updateMany({ where: { whatsappMessageId }, data: updateData }),
          prisma.directMessage.updateMany({ where: { whatsappMessageId }, data: updateData }),
        ])
      }
    }
  })
}
