import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middleware/auth.middleware'
import { listPatientsWithCadence } from './patients.service'

export async function patientRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware)

  app.get('/patients', async (request) => {
    return listPatientsWithCadence(request.clinicId)
  })
}
