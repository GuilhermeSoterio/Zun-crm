import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface JwtPayload {
  clinicId: string
  email: string
}

declare module 'fastify' {
  interface FastifyRequest {
    clinicId: string
    clinicEmail: string
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Token não informado' })
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    request.clinicId = payload.clinicId
    request.clinicEmail = payload.email
  } catch {
    return reply.status(401).send({ error: 'Token inválido ou expirado' })
  }
}
