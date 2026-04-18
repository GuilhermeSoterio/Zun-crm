import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { registerClinic, loginClinic } from './auth.service'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  cnpj: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (request, reply) => {
    const body = registerSchema.parse(request.body)
    try {
      const result = await registerClinic(body)
      return reply.status(201).send(result)
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.post('/auth/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)
    try {
      const result = await loginClinic(body.email, body.password)
      return reply.send(result)
    } catch (err: any) {
      return reply.status(401).send({ error: err.message })
    }
  })
}
