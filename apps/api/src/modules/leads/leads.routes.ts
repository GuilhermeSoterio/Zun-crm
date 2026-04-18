import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth.middleware'
import * as svc from './leads.service'

export async function leadsRoutes(app: FastifyInstance) {
  // ─── Funnels ───────────────────────────────────────────────────────────────

  app.get('/funnels', { preHandler: [authMiddleware] }, async (req) => {
    const { clinicId } = req as any
    return svc.listFunnels(clinicId)
  })

  app.post('/funnels', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { clinicId } = req as any
    const body = z.object({ name: z.string().min(1), color: z.string().optional() }).parse(req.body)
    const funnel = await svc.createFunnel(clinicId, body)
    return reply.code(201).send(funnel)
  })

  app.patch('/funnels/:id', { preHandler: [authMiddleware] }, async (req) => {
    const { clinicId } = req as any
    const { id } = req.params as { id: string }
    const body = z.object({ name: z.string().min(1).optional(), color: z.string().optional() }).parse(req.body)
    await svc.updateFunnel(clinicId, id, body)
    return { ok: true }
  })

  app.delete('/funnels/:id', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { clinicId } = req as any
    const { id } = req.params as { id: string }
    await svc.deleteFunnel(clinicId, id)
    return reply.code(204).send()
  })

  app.post('/funnels/:id/stages', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { clinicId } = req as any
    const { id } = req.params as { id: string }
    const body = z.object({ name: z.string().min(1), color: z.string().optional() }).parse(req.body)
    const stage = await svc.addStage(clinicId, id, body)
    return reply.code(201).send(stage)
  })

  app.patch('/funnels/:id/stages/:stageId', { preHandler: [authMiddleware] }, async (req) => {
    const { clinicId } = req as any
    const { id, stageId } = req.params as { id: string; stageId: string }
    const body = z.object({
      name: z.string().min(1).optional(),
      color: z.string().optional(),
      isWon: z.boolean().optional(),
      isLost: z.boolean().optional(),
    }).parse(req.body)
    await svc.updateStage(clinicId, id, stageId, body)
    return { ok: true }
  })

  app.delete('/funnels/:id/stages/:stageId', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { clinicId } = req as any
    const { id, stageId } = req.params as { id: string; stageId: string }
    await svc.deleteStage(clinicId, id, stageId)
    return reply.code(204).send()
  })

  app.patch('/funnels/:id/stages/reorder', { preHandler: [authMiddleware] }, async (req) => {
    const { clinicId } = req as any
    const { id } = req.params as { id: string }
    const body = z.object({ stageIds: z.array(z.string()) }).parse(req.body)
    await svc.reorderStages(clinicId, id, body.stageIds)
    return { ok: true }
  })

  // ─── Leads ─────────────────────────────────────────────────────────────────

  app.get('/leads', { preHandler: [authMiddleware] }, async (req) => {
    const { clinicId } = req as any
    const { funnelId } = z.object({ funnelId: z.string() }).parse(req.query)
    return svc.listLeads(clinicId, funnelId)
  })

  app.post('/leads', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { clinicId } = req as any
    const body = z.object({
      funnelId: z.string(),
      stageId: z.string().optional(),
      name: z.string().min(1),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      source: z.string().optional(),
      notes: z.string().optional(),
      estimatedValue: z.number().positive().optional(),
    }).parse(req.body)
    const lead = await svc.createLead(clinicId, body)
    return reply.code(201).send(lead)
  })

  app.get('/leads/:id', { preHandler: [authMiddleware] }, async (req) => {
    const { clinicId } = req as any
    const { id } = req.params as { id: string }
    return svc.getLead(clinicId, id)
  })

  app.patch('/leads/:id', { preHandler: [authMiddleware] }, async (req) => {
    const { clinicId } = req as any
    const { id } = req.params as { id: string }
    const body = z.object({
      name: z.string().min(1).optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      source: z.string().optional(),
      notes: z.string().optional(),
      estimatedValue: z.number().positive().optional(),
    }).parse(req.body)
    await svc.updateLead(clinicId, id, body)
    return { ok: true }
  })

  app.patch('/leads/:id/stage', { preHandler: [authMiddleware] }, async (req) => {
    const { clinicId } = req as any
    const { id } = req.params as { id: string }
    const { stageId } = z.object({ stageId: z.string() }).parse(req.body)
    await svc.moveLead(clinicId, id, stageId)
    return { ok: true }
  })

  app.patch('/leads/:id/win', { preHandler: [authMiddleware] }, async (req) => {
    const { clinicId } = req as any
    const { id } = req.params as { id: string }
    const body = z.object({
      actualValue: z.number().positive().optional(),
      createPatient: z.boolean().optional(),
    }).parse(req.body)
    return svc.winLead(clinicId, id, body)
  })

  app.patch('/leads/:id/lose', { preHandler: [authMiddleware] }, async (req) => {
    const { clinicId } = req as any
    const { id } = req.params as { id: string }
    const { reason } = z.object({ reason: z.string().optional() }).parse(req.body)
    await svc.loseLead(clinicId, id, reason)
    return { ok: true }
  })

  app.delete('/leads/:id', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { clinicId } = req as any
    const { id } = req.params as { id: string }
    await svc.deleteLead(clinicId, id)
    return reply.code(204).send()
  })
}
