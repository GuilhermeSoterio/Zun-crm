import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth.middleware'
import { createCampaign, listCampaigns, previewPatients, listCampaignPatients, convertPatient } from './campaigns.service'

const sequenceSchema = z.object({
  stepNumber: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  delayDays: z.union([z.literal(0), z.literal(3), z.literal(7)]),
  templateBody: z.string().min(10),
})

const filterSchema = z.object({
  inactiveDays: z.number().min(30).default(180),
  procedures: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
})

const createCampaignSchema = z.object({
  name: z.string().min(3),
  targetFilter: filterSchema,
  sequences: z.array(sequenceSchema).min(1).max(3),
  avgTicket: z.number().positive(),
})

export async function campaignRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware)

  app.get('/campaigns', async (request) => {
    return listCampaigns(request.clinicId)
  })

  app.post('/campaigns', async (request, reply) => {
    const body = createCampaignSchema.parse(request.body)
    const campaign = await createCampaign(request.clinicId, body)
    return reply.status(201).send(campaign)
  })

  app.post('/campaigns/preview', async (request) => {
    const body = z.object({ targetFilter: filterSchema }).parse(request.body)
    const count = await previewPatients(request.clinicId, body.targetFilter)
    return { count }
  })

  app.get('/campaigns/:id/patients', async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params)
    const { status } = z.object({ status: z.string().optional() }).parse(request.query)
    return listCampaignPatients(request.clinicId, id, status)
  })

  app.patch('/campaigns/:id/patients/:cpId/convert', async (request, reply) => {
    const { id, cpId } = z
      .object({ id: z.string(), cpId: z.string() })
      .parse(request.params)
    const { actualValue, note } = z
      .object({ actualValue: z.number().positive(), note: z.string().optional() })
      .parse(request.body)
    const result = await convertPatient(request.clinicId, id, cpId, actualValue, note)
    return reply.status(200).send(result)
  })
}
