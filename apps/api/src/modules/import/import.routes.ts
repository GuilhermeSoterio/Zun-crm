import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth.middleware'
import { prisma } from '../../config/database'
import { importQueue } from '../../queues'

const fieldMappingSchema = z.object({
  name: z.string(),
  phone: z.string(),
  lastAppointmentDate: z.string().optional(),
  lastProcedure: z.string().optional(),
})

export async function importRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware)

  // Upload de CSV (em dev, recebe o conteúdo diretamente; em prod usaria R2)
  app.post('/import/upload', async (request, reply) => {
    const data = await request.file()
    if (!data) {
      return reply.status(400).send({ error: 'Arquivo não enviado' })
    }

    const fieldMappingRaw = request.headers['x-field-mapping']
    if (!fieldMappingRaw || typeof fieldMappingRaw !== 'string') {
      return reply.status(400).send({ error: 'Header x-field-mapping obrigatório' })
    }

    const fieldMapping = fieldMappingSchema.parse(JSON.parse(fieldMappingRaw))
    const csvContent = await data.toBuffer().then((b) => b.toString('utf-8'))

    const importJob = await prisma.importJob.create({
      data: {
        clinicId: request.clinicId,
        filename: data.filename,
        r2Key: `dev/${request.clinicId}/${Date.now()}-${data.filename}`,
        fieldMapping,
      },
    })

    await importQueue.add('process-csv', {
      importJobId: importJob.id,
      clinicId: request.clinicId,
      csvContent,
      fieldMapping,
    })

    return reply.status(202).send({ importJobId: importJob.id })
  })

  // Polling de progresso
  app.get('/import/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string }
    const job = await prisma.importJob.findFirst({
      where: { id, clinicId: request.clinicId },
    })

    if (!job) return reply.status(404).send({ error: 'Job não encontrado' })

    return {
      id: job.id,
      status: job.status,
      totalRows: job.totalRows,
      processedRows: job.processedRows,
      errorRows: job.errorRows,
      filename: job.filename,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    }
  })

  // Listar imports recentes
  app.get('/import', async (request) => {
    return prisma.importJob.findMany({
      where: { clinicId: request.clinicId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        filename: true,
        status: true,
        totalRows: true,
        processedRows: true,
        errorRows: true,
        createdAt: true,
        completedAt: true,
      },
    })
  })
}
