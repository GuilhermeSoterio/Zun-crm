/**
 * Seed de dados demo — clínica odontológica fictícia
 * Login: demo@reativa.com / demo123
 *
 * Roda com: pnpm --filter api tsx prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client'
import {
  createCipheriv,
  createHmac, randomBytes, createHash,
} from 'crypto'

// ─── Cripto inline (evita importar env.ts que faz process.exit) ───────────────

const MASTER_KEY = '8b05ac92583405b7aa2e4658a6dbddc149edcc6742e316d82a32b593e50d1dd0'
const ALGO = 'aes-256-gcm'
const IV_LEN = 12
const TAG_LEN = 16

function deriveKey(clinicId: string) {
  return createHmac('sha256', Buffer.from(MASTER_KEY, 'hex')).update(clinicId).digest()
}
function enc(plain: string, clinicId: string) {
  const key = deriveKey(clinicId)
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64')
}
function hashPhone(phone: string) {
  return createHash('sha256').update(phone).digest('hex')
}

// ─── Dados ────────────────────────────────────────────────────────────────────

const PROCEDURES = [
  'Limpeza e Profilaxia',
  'Clareamento Dental',
  'Implante Dentário',
  'Ortodontia',
  'Canal Radicular',
  'Restauração',
  'Consulta de Avaliação',
  'Prótese Dentária',
  'Extração',
  'Facetas de Porcelana',
]

const PATIENTS_DATA = [
  { name: 'Ana Paula Ferreira',    phone: '5511991110001', inactive: 210, procedure: 'Limpeza e Profilaxia' },
  { name: 'Carlos Eduardo Silva',  phone: '5511991110002', inactive: 185, procedure: 'Implante Dentário' },
  { name: 'Beatriz Santos Lima',   phone: '5511991110003', inactive: 320, procedure: 'Clareamento Dental' },
  { name: 'Ricardo Alves Nunes',   phone: '5511991110004', inactive: 95,  procedure: 'Ortodontia' },
  { name: 'Fernanda Costa Rocha',  phone: '5511991110005', inactive: 440, procedure: 'Canal Radicular' },
  { name: 'Marcos Vinícius Souza', phone: '5511991110006', inactive: 150, procedure: 'Restauração' },
  { name: 'Juliana Mendes Pinto',  phone: '5511991110007', inactive: 270, procedure: 'Limpeza e Profilaxia' },
  { name: 'Thiago Rodrigues Dias', phone: '5511991110008', inactive: 380, procedure: 'Prótese Dentária' },
  { name: 'Camila Oliveira Torres',phone: '5511991110009', inactive: 130, procedure: 'Clareamento Dental' },
  { name: 'Lucas Henrique Borges', phone: '5511991110010', inactive: 200, procedure: 'Implante Dentário' },
  { name: 'Patrícia Lima Carvalho',phone: '5511991110011', inactive: 290, procedure: 'Facetas de Porcelana' },
  { name: 'Bruno Martins Freitas', phone: '5511991110012', inactive: 175, procedure: 'Canal Radicular' },
  { name: 'Vanessa Cunha Moreira', phone: '5511991110013', inactive: 500, procedure: 'Limpeza e Profilaxia' },
  { name: 'Diego Ferreira Braga',  phone: '5511991110014', inactive: 225, procedure: 'Restauração' },
  { name: 'Aline Nascimento Cruz', phone: '5511991110015', inactive: 310, procedure: 'Ortodontia' },
  { name: 'Felipe Araújo Campos',  phone: '5511991110016', inactive: 145, procedure: 'Implante Dentário' },
  { name: 'Renata Barbosa Gomes',  phone: '5511991110017', inactive: 260, procedure: 'Clareamento Dental' },
  { name: 'Eduardo Lopes Teixeira',phone: '5511991110018', inactive: 190, procedure: 'Prótese Dentária' },
  { name: 'Isabela Vaz Batista',   phone: '5511991110019', inactive: 350, procedure: 'Limpeza e Profilaxia' },
  { name: 'Rafael Moura Andrade',  phone: '5511991110020', inactive: 115, procedure: 'Restauração' },
  { name: 'Luciana Duarte Mello',  phone: '5511991110021', inactive: 400, procedure: 'Facetas de Porcelana' },
  { name: 'Alexandre Ramos Neto',  phone: '5511991110022', inactive: 240, procedure: 'Canal Radicular' },
  { name: 'Priscila Torres Leite', phone: '5511991110023', inactive: 165, procedure: 'Limpeza e Profilaxia' },
  { name: 'Guilherme Faria Pires', phone: '5511991110024', inactive: 285, procedure: 'Implante Dentário' },
  { name: 'Tatiana Nogueira Paz',  phone: '5511991110025', inactive: 335, procedure: 'Ortodontia' },
  { name: 'Rodrigo Melo Correia',  phone: '5511991110026', inactive: 120, procedure: 'Clareamento Dental' },
  { name: 'Mariana Cardoso Fonseca',phone:'5511991110027', inactive: 450, procedure: 'Prótese Dentária' },
  { name: 'Daniel Abreu Oliveira', phone: '5511991110028', inactive: 195, procedure: 'Restauração' },
  { name: 'Letícia Pinheiro Santos',phone:'5511991110029', inactive: 275, procedure: 'Limpeza e Profilaxia' },
  { name: 'André Cavalcanti Luz',  phone: '5511991110030', inactive: 360, procedure: 'Canal Radicular' },
  { name: 'Cristina Ribeiro Paz',  phone: '5511991110031', inactive: 140, procedure: 'Facetas de Porcelana' },
  { name: 'Sandro Vieira Costa',   phone: '5511991110032', inactive: 230, procedure: 'Implante Dentário' },
  { name: 'Paula Monteiro Dias',   phone: '5511991110033', inactive: 305, procedure: 'Limpeza e Profilaxia' },
  { name: 'Nelson Pereira Lemos',  phone: '5511991110034', inactive: 180, procedure: 'Restauração' },
  { name: 'Claudia Azevedo Nunes', phone: '5511991110035', inactive: 420, procedure: 'Clareamento Dental' },
  { name: 'Marcelo Queiroz Lima',  phone: '5511991110036', inactive: 250, procedure: 'Ortodontia' },
  { name: 'Simone Coelho Alves',   phone: '5511991110037', inactive: 155, procedure: 'Prótese Dentária' },
  { name: 'Flávio Silveira Brito', phone: '5511991110038', inactive: 390, procedure: 'Canal Radicular' },
  { name: 'Carla Mendes Ribeiro',  phone: '5511991110039', inactive: 210, procedure: 'Limpeza e Profilaxia' },
  { name: 'Sérgio Assis Machado',  phone: '5511991110040', inactive: 170, procedure: 'Facetas de Porcelana' },
  { name: 'Elaine Teles Figueiredo',phone:'5511991110041', inactive: 340, procedure: 'Implante Dentário' },
  { name: 'Ronaldo Matos Correia', phone: '5511991110042', inactive: 108, procedure: 'Restauração' },
  { name: 'Sabrina Luz Carvalho',  phone: '5511991110043', inactive: 460, procedure: 'Clareamento Dental' },
  { name: 'Ivan Neves Andrade',    phone: '5511991110044', inactive: 132, procedure: 'Limpeza e Profilaxia' },
  { name: 'Helena Costa Duarte',   phone: '5511991110045', inactive: 215, procedure: 'Facetas de Porcelana' },
]

// Índices dos pacientes por campanha/status
// Campanha 1 (COMPLETED): índices 0-19 (20 pacientes)
// Campanha 2 (ACTIVE - Implantes): índices 20-29 (10 pacientes)
// Campanha 3 (ACTIVE - Limpeza): índices 30-39 (10 pacientes)
// Sem campanha: índices 40-44 (5 pacientes)

const CAMPAIGN1_DISTRIBUTION: Record<number, { status: string; step: number; converted?: boolean; ai?: string }> = {
  0:  { status: 'CONVERTED',  step: 3, converted: true },
  1:  { status: 'CONVERTED',  step: 2, converted: true },
  2:  { status: 'CONVERTED',  step: 1, converted: true },
  3:  { status: 'CONVERTED',  step: 3, converted: true },
  4:  { status: 'CONVERTED',  step: 2, converted: true },
  5:  { status: 'RESPONDED',  step: 3, ai: 'reschedule' },
  6:  { status: 'RESPONDED',  step: 2, ai: 'interested' },
  7:  { status: 'RESPONDED',  step: 2, ai: 'question' },
  8:  { status: 'IN_PROGRESS',step: 3 },
  9:  { status: 'IN_PROGRESS',step: 3 },
  10: { status: 'IN_PROGRESS',step: 2 },
  11: { status: 'IN_PROGRESS',step: 1 },
  12: { status: 'OPTED_OUT',  step: 1, ai: 'opt_out' },
  13: { status: 'OPTED_OUT',  step: 2, ai: 'opt_out' },
  14: { status: 'PENDING',    step: 0 },
  15: { status: 'PENDING',    step: 0 },
  16: { status: 'CONVERTED',  step: 1, converted: true },
  17: { status: 'RESPONDED',  step: 1, ai: 'interested' },
  18: { status: 'IN_PROGRESS',step: 2 },
  19: { status: 'PENDING',    step: 0 },
}

const CAMPAIGN2_DISTRIBUTION: Record<number, { status: string; step: number; converted?: boolean; ai?: string }> = {
  20: { status: 'CONVERTED',  step: 2, converted: true },
  21: { status: 'CONVERTED',  step: 1, converted: true },
  22: { status: 'RESPONDED',  step: 2, ai: 'interested' },
  23: { status: 'RESPONDED',  step: 1, ai: 'question' },
  24: { status: 'IN_PROGRESS',step: 2 },
  25: { status: 'IN_PROGRESS',step: 1 },
  26: { status: 'IN_PROGRESS',step: 1 },
  27: { status: 'PENDING',    step: 0 },
  28: { status: 'PENDING',    step: 0 },
  29: { status: 'OPTED_OUT',  step: 1, ai: 'opt_out' },
}

const CAMPAIGN3_DISTRIBUTION: Record<number, { status: string; step: number; converted?: boolean; ai?: string }> = {
  30: { status: 'CONVERTED',  step: 1, converted: true },
  31: { status: 'RESPONDED',  step: 2, ai: 'reschedule' },
  32: { status: 'RESPONDED',  step: 1, ai: 'interested' },
  33: { status: 'IN_PROGRESS',step: 2 },
  34: { status: 'IN_PROGRESS',step: 1 },
  35: { status: 'IN_PROGRESS',step: 1 },
  36: { status: 'PENDING',    step: 0 },
  37: { status: 'PENDING',    step: 0 },
  38: { status: 'PENDING',    step: 0 },
  39: { status: 'OPTED_OUT',  step: 1, ai: 'not_interested' },
}

const PROCEDURE_PRICES: Record<string, number> = {
  'Limpeza e Profilaxia':   180,
  'Clareamento Dental':     800,
  'Implante Dentário':     3500,
  'Ortodontia':            4200,
  'Canal Radicular':       1200,
  'Restauração':            350,
  'Consulta de Avaliação':  150,
  'Prótese Dentária':      2800,
  'Extração':               250,
  'Facetas de Porcelana':  5500,
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const prisma = new PrismaClient()

  try {
    console.log('🌱 Iniciando seed...')

    // 1. Limpar dados existentes da clínica demo
    const existing = await prisma.clinic.findUnique({ where: { email: 'demo@reativa.com' } })
    if (existing) {
      console.log('   Limpando dados anteriores...')
      // Cascata via FK — apaga na ordem correta
      await prisma.message.deleteMany({ where: { clinicId: existing.id } })
      await prisma.campaignPatient.deleteMany({ where: { campaign: { clinicId: existing.id } } })
      await prisma.messageSequence.deleteMany({ where: { campaign: { clinicId: existing.id } } })
      await prisma.campaign.deleteMany({ where: { clinicId: existing.id } })
      await prisma.patient.deleteMany({ where: { clinicId: existing.id } })
      await prisma.procedurePrice.deleteMany({ where: { clinicId: existing.id } })
      await prisma.clinic.delete({ where: { id: existing.id } })
    }

    // 2. Criar clínica demo — mesma lógica de auth.service.ts: SHA256(password + JWT_SECRET)
    const JWT_SECRET = 'reativa-dev-secret-key-must-be-at-least-32-chars-long-ok'
    const passwordHash = createHash('sha256').update('demo123' + JWT_SECRET).digest('hex')
    const clinic = await prisma.clinic.create({
      data: {
        name: 'Clínica Sorrir Bem',
        email: 'demo@reativa.com',
        passwordHash,
        plan: 'PROFESSIONAL',
        avgTicket: 1200,
        whatsappConnected: true,
        whatsappInstance: 'sorrir-bem-demo',
      },
    })
    console.log(`   ✅ Clínica criada: ${clinic.name} (${clinic.id})`)

    // 3. Preços de procedimentos
    await prisma.procedurePrice.createMany({
      data: Object.entries(PROCEDURE_PRICES).map(([procedureName, price]) => ({
        clinicId: clinic.id,
        procedureName,
        price,
      })),
    })
    console.log('   ✅ Preços de procedimentos criados')

    // 4. Pacientes
    const now = new Date()
    const patientRecords = await Promise.all(
      PATIENTS_DATA.map(async (p) => {
        const lastAppointment = new Date(now.getTime() - p.inactive * 24 * 60 * 60 * 1000)
        return prisma.patient.create({
          data: {
            clinicId: clinic.id,
            nameEncrypted: enc(p.name, clinic.id),
            phoneEncrypted: enc(p.phone, clinic.id),
            phoneHash: hashPhone(p.phone),
            lastAppointmentDate: lastAppointment,
            lastProcedure: p.procedure,
            inactiveDays: p.inactive,
            source: 'csv_import',
          },
        })
      })
    )
    console.log(`   ✅ ${patientRecords.length} pacientes criados`)

    // 5. Campanha 1 — Reativação Geral (COMPLETED, 90 dias atrás)
    const camp1Start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const camp1 = await prisma.campaign.create({
      data: {
        clinicId: clinic.id,
        name: 'Reativação Geral — Out/2025',
        status: 'COMPLETED',
        targetFilter: { inactiveDays: 90, procedures: [], tags: [] },
        avgTicket: 900,
        startedAt: camp1Start,
        completedAt: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000),
      },
    })

    const [seq1a, seq1b, seq1c] = await Promise.all([
      prisma.messageSequence.create({ data: { campaignId: camp1.id, stepNumber: 1, delayDays: 0,  templateBody: 'Olá {{nome}}! Sentimos sua falta na Clínica Sorrir Bem. Que tal marcar uma revisão? Tem promoção especial este mês 😊' } }),
      prisma.messageSequence.create({ data: { campaignId: camp1.id, stepNumber: 2, delayDays: 3,  templateBody: 'Oi {{nome}}, tudo bem? Estou passando para lembrar que sua última consulta foi há {{diasInativo}} dias. Podemos te ajudar com {{ultimoProcedimento}}!' } }),
      prisma.messageSequence.create({ data: { campaignId: camp1.id, stepNumber: 3, delayDays: 7,  templateBody: '{{nome}}, última mensagem! Liberei um horário exclusivo para você esta semana. Gostaria de confirmar?' } }),
    ])

    // 6. Campanha 2 — Implantes (ACTIVE, 20 dias atrás)
    const camp2Start = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000)
    const camp2 = await prisma.campaign.create({
      data: {
        clinicId: clinic.id,
        name: 'Implantes Q1/2026',
        status: 'ACTIVE',
        targetFilter: { inactiveDays: 120, procedures: ['Implante Dentário'], tags: [] },
        avgTicket: 3500,
        startedAt: camp2Start,
      },
    })

    const [seq2a, seq2b] = await Promise.all([
      prisma.messageSequence.create({ data: { campaignId: camp2.id, stepNumber: 1, delayDays: 0, templateBody: 'Olá {{nome}}! A Sorrir Bem está com condições especiais de parcelamento para implante dentário. Podemos conversar? 🦷' } }),
      prisma.messageSequence.create({ data: { campaignId: camp2.id, stepNumber: 2, delayDays: 5, templateBody: '{{nome}}, ainda temos vagas na agenda esta semana para avaliação gratuita de implante. Interesse?' } }),
    ])

    // 7. Campanha 3 — Limpeza (ACTIVE, 7 dias atrás)
    const camp3Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const camp3 = await prisma.campaign.create({
      data: {
        clinicId: clinic.id,
        name: 'Limpeza + Revisão — Abr/2026',
        status: 'ACTIVE',
        targetFilter: { inactiveDays: 90, procedures: ['Limpeza e Profilaxia'], tags: [] },
        avgTicket: 250,
        startedAt: camp3Start,
      },
    })

    const [seq3a, seq3b] = await Promise.all([
      prisma.messageSequence.create({ data: { campaignId: camp3.id, stepNumber: 1, delayDays: 0, templateBody: 'Oi {{nome}}! Você sabia que a limpeza dental a cada 6 meses previne problemas sérios? Sua última foi há {{diasInativo}} dias 😬 Agende agora!' } }),
      prisma.messageSequence.create({ data: { campaignId: camp3.id, stepNumber: 2, delayDays: 4, templateBody: '{{nome}}, promoção de limpeza + revisão por apenas R$199 essa semana! Não perca 🎉' } }),
    ])

    console.log('   ✅ 3 campanhas e sequências criadas')

    // 8. CampaignPatients + Messages
    const allDistributions = [
      { campaign: camp1, seqs: [seq1a, seq1b, seq1c], dist: CAMPAIGN1_DISTRIBUTION, daysAgo: 90 },
      { campaign: camp2, seqs: [seq2a, seq2b],         dist: CAMPAIGN2_DISTRIBUTION, daysAgo: 20 },
      { campaign: camp3, seqs: [seq3a, seq3b],         dist: CAMPAIGN3_DISTRIBUTION, daysAgo: 7  },
    ]

    let totalCPs = 0
    let totalMsgs = 0

    for (const { campaign, seqs, dist, daysAgo } of allDistributions) {
      for (const [idxStr, cpMeta] of Object.entries(dist)) {
        const idx = Number(idxStr)
        const patient = patientRecords[idx]
        const proc = PATIENTS_DATA[idx].procedure
        const estimatedValue = PROCEDURE_PRICES[proc] ?? 500
        const cpStarted = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

        const cp = await prisma.campaignPatient.create({
          data: {
            campaignId: campaign.id,
            patientId: patient.id,
            currentStep: cpMeta.step,
            status: cpMeta.status as any,
            estimatedValue,
            actualValue: cpMeta.converted ? estimatedValue * (0.85 + Math.random() * 0.3) : null,
            convertedAt: cpMeta.converted ? new Date(cpStarted.getTime() + 14 * 24 * 60 * 60 * 1000) : null,
            convertedNote: cpMeta.converted ? 'Paciente agendou pelo WhatsApp e compareceu.' : null,
          },
        })
        totalCPs++

        // Criar mensagens OUTBOUND para cada step realizado
        const stepsToCreate = Math.max(cpMeta.step, cpMeta.status === 'PENDING' ? 0 : 1)
        for (let step = 1; step <= stepsToCreate && step <= seqs.length; step++) {
          const seq = seqs[step - 1]
          const msgDate = new Date(cpStarted.getTime() + (step - 1) * 3 * 24 * 60 * 60 * 1000)

          const msgStatus =
            cpMeta.status === 'RESPONDED' || cpMeta.status === 'CONVERTED'
              ? 'READ'
              : cpMeta.status === 'IN_PROGRESS'
              ? 'DELIVERED'
              : cpMeta.status === 'OPTED_OUT'
              ? 'READ'
              : 'SENT'

          await prisma.message.create({
            data: {
              campaignPatientId: cp.id,
              sequenceId: seq.id,
              clinicId: clinic.id,
              direction: 'OUTBOUND',
              bodyEncrypted: enc(seq.templateBody, clinic.id),
              status: msgStatus as any,
              scheduledAt: msgDate,
              sentAt: msgDate,
              deliveredAt: new Date(msgDate.getTime() + 30 * 1000),
              readAt: msgStatus === 'READ' ? new Date(msgDate.getTime() + 5 * 60 * 1000) : null,
            },
          })
          totalMsgs++
        }

        // Mensagem INBOUND (resposta) para pacientes que responderam ou converteram
        if ((cpMeta.status === 'RESPONDED' || cpMeta.status === 'CONVERTED' || cpMeta.status === 'OPTED_OUT') && cpMeta.ai) {
          const replyDate = new Date(cpStarted.getTime() + (cpMeta.step - 1) * 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)
          const replyTexts: Record<string, string> = {
            interested:     'Olá! Sim, tenho interesse sim! Qual horário vocês têm disponível?',
            reschedule:     'Oi! Pode sim, mas não consigo essa semana. Tem horário para semana que vem?',
            question:       'Boa tarde! Vocês fazem parcelamento? Qual o valor da consulta?',
            opt_out:        'Por favor, não me mande mais mensagens.',
            not_interested: 'Não tenho interesse no momento, obrigado.',
          }

          await prisma.message.create({
            data: {
              campaignPatientId: cp.id,
              sequenceId: seqs[Math.max(0, cpMeta.step - 1)].id,
              clinicId: clinic.id,
              direction: 'INBOUND',
              bodyEncrypted: enc(replyTexts[cpMeta.ai] ?? 'Ok!', clinic.id),
              status: 'DELIVERED',
              scheduledAt: replyDate,
              sentAt: replyDate,
              deliveredAt: replyDate,
              aiClassification: cpMeta.ai,
              aiConfidence: 0.85 + Math.random() * 0.14,
              aiProcessedAt: new Date(replyDate.getTime() + 5000),
            },
          })
          totalMsgs++
        }
      }
    }

    console.log(`   ✅ ${totalCPs} CampaignPatients e ${totalMsgs} mensagens criados`)

    // 9. Resumo
    console.log('\n🎉 Seed concluído com sucesso!')
    console.log('─────────────────────────────────────────')
    console.log('  Login:  demo@reativa.com')
    console.log('  Senha:  demo123')
    console.log('─────────────────────────────────────────')
    console.log(`  Pacientes:   ${patientRecords.length}`)
    console.log('  Campanhas:   3  (1 concluída + 2 ativas)')
    console.log(`  Interações:  ${totalCPs} pacientes em cadência`)
    console.log(`  Mensagens:   ${totalMsgs}`)
    console.log('─────────────────────────────────────────')

  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
