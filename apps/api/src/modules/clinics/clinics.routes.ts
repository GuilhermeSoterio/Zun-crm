import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth.middleware'
import { listProcedurePrices, upsertProcedurePrice, deleteProcedurePrice } from './clinics.service'

export async function clinicsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware)

  app.get('/procedure-prices', async (request) => {
    return listProcedurePrices(request.clinicId)
  })

  app.post('/procedure-prices', async (request, reply) => {
    const body = z
      .object({ procedureName: z.string().min(2), price: z.number().positive() })
      .parse(request.body)
    const result = await upsertProcedurePrice(request.clinicId, body.procedureName, body.price)
    return reply.status(201).send(result)
  })

  app.delete('/procedure-prices/:id', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params)
    await deleteProcedurePrice(request.clinicId, id)
    return reply.status(204).send()
  })
}
