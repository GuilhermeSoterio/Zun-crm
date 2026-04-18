import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import { authRoutes } from './modules/auth/auth.routes'
import { campaignRoutes } from './modules/campaigns/campaigns.routes'
import { clinicsRoutes } from './modules/clinics/clinics.routes'
import { importRoutes } from './modules/import/import.routes'
import { webhookRoutes } from './modules/webhooks/webhooks.routes'
import { dashboardRoutes } from './modules/dashboard/dashboard.routes'
import { patientRoutes } from './modules/patients/patients.routes'
import { leadsRoutes } from './modules/leads/leads.routes'
import { inboxRoutes } from './modules/inbox/inbox.routes'

export async function buildApp() {
  const app = Fastify({ logger: true })

  await app.register(helmet, { contentSecurityPolicy: false })
  await app.register(cors, { origin: true, credentials: true })
  await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } }) // 50MB
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req) => (req as any).clinicId || req.ip,
  })

  // Rotas
  await app.register(authRoutes)
  await app.register(campaignRoutes)
  await app.register(clinicsRoutes)
  await app.register(importRoutes)
  await app.register(webhookRoutes)
  await app.register(dashboardRoutes)
  await app.register(patientRoutes)
  await app.register(leadsRoutes)
  await app.register(inboxRoutes)

  // Health check
  app.get('/health', async () => ({ ok: true, ts: new Date().toISOString() }))

  return app
}
