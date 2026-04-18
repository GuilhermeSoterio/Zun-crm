import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth.middleware'
import * as svc from './inbox.service'

export async function inboxRoutes(app: FastifyInstance) {
  // ─── Inbox ─────────────────────────────────────────────────────────────────

  app.get('/inbox', { preHandler: [authMiddleware] }, async (req) => {
    const { clinicId } = req as any
    return svc.listConversations(clinicId)
  })

  app.get('/inbox/:patientId', { preHandler: [authMiddleware] }, async (req) => {
    const { clinicId } = req as any
    const { patientId } = req.params as { patientId: string }
    return svc.getConversation(clinicId, patientId)
  })

  app.post('/inbox/:patientId/send', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { clinicId } = req as any
    const { patientId } = req.params as { patientId: string }
    const { body } = z.object({ body: z.string().min(1) }).parse(req.body)
    const result = await svc.sendDirectMessage(clinicId, patientId, body)
    return reply.code(201).send(result)
  })

  // ─── Quick Replies ──────────────────────────────────────────────────────────

  app.get('/quick-replies', { preHandler: [authMiddleware] }, async (req) => {
    const { clinicId } = req as any
    return svc.listQuickReplies(clinicId)
  })

  app.post('/quick-replies', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { clinicId } = req as any
    const body = z.object({ title: z.string().min(1), body: z.string().min(1) }).parse(req.body)
    const qr = await svc.createQuickReply(clinicId, body)
    return reply.code(201).send(qr)
  })

  app.patch('/quick-replies/:id', { preHandler: [authMiddleware] }, async (req) => {
    const { clinicId } = req as any
    const { id } = req.params as { id: string }
    const body = z.object({ title: z.string().min(1).optional(), body: z.string().min(1).optional() }).parse(req.body)
    await svc.updateQuickReply(clinicId, id, body)
    return { ok: true }
  })

  app.delete('/quick-replies/:id', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { clinicId } = req as any
    const { id } = req.params as { id: string }
    await svc.deleteQuickReply(clinicId, id)
    return reply.code(204).send()
  })
}
