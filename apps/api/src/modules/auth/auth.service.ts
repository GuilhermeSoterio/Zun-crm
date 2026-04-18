import { createHash } from 'crypto'
import jwt from 'jsonwebtoken'
import { prisma } from '../../config/database'
import { env } from '../../config/env'
import { createDefaultFunnel } from '../leads/leads.service'

function hashPassword(password: string): string {
  return createHash('sha256').update(password + env.JWT_SECRET).digest('hex')
}

export async function registerClinic(data: {
  name: string
  email: string
  password: string
  cnpj?: string
}) {
  const existing = await prisma.clinic.findUnique({ where: { email: data.email } })
  if (existing) {
    throw new Error('Email já cadastrado')
  }

  const clinic = await prisma.clinic.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: hashPassword(data.password),
      cnpj: data.cnpj,
    },
    select: { id: true, name: true, email: true, plan: true },
  })

  await createDefaultFunnel(clinic.id)

  const token = jwt.sign(
    { clinicId: clinic.id, email: clinic.email },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  return { clinic, token }
}

export async function loginClinic(email: string, password: string) {
  const clinic = await prisma.clinic.findUnique({ where: { email } })
  if (!clinic || clinic.passwordHash !== hashPassword(password)) {
    throw new Error('Email ou senha inválidos')
  }

  const token = jwt.sign(
    { clinicId: clinic.id, email: clinic.email },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  return {
    clinic: { id: clinic.id, name: clinic.name, email: clinic.email, plan: clinic.plan },
    token,
  }
}
