import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middleware/auth.middleware'
import { prisma } from '../../config/database'

export async function dashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware)

  app.get('/dashboard', async (request) => {
    const clinicId = request.clinicId

    const [funnelData, revenueData, activeCampaigns, timeline, aiBreakdown] = await Promise.all([
      // Funil por status
      prisma.campaignPatient.groupBy({
        by: ['status'],
        where: { campaign: { clinicId } },
        _count: { status: true },
      }),

      // Receita recuperada (converted)
      prisma.campaignPatient.aggregate({
        where: { campaign: { clinicId }, status: 'CONVERTED' },
        _sum: { estimatedValue: true },
      }),

      // Campanhas ativas
      prisma.campaign.count({ where: { clinicId, status: 'ACTIVE' } }),

      // Timeline (últimos 30 dias)
      prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE("sentAt")::text as date, COUNT(*)::bigint as count
        FROM messages
        WHERE "clinicId" = ${clinicId}
          AND direction = 'OUTBOUND'::"Direction"
          AND "sentAt" >= NOW() - INTERVAL '30 days'
        GROUP BY DATE("sentAt")
        ORDER BY date ASC
      `,

      // Breakdown de classificações IA
      prisma.message.groupBy({
        by: ['aiClassification'],
        where: { clinicId, direction: 'INBOUND', aiClassification: { not: null } },
        _count: { aiClassification: true },
      }),
    ])

    const funnel = {
      pending: 0,
      inProgress: 0,
      responded: 0,
      converted: 0,
    }

    for (const row of funnelData) {
      if (row.status === 'PENDING') funnel.pending = row._count.status
      if (row.status === 'IN_PROGRESS') funnel.inProgress = row._count.status
      if (row.status === 'RESPONDED') funnel.responded = row._count.status
      if (row.status === 'CONVERTED') funnel.converted = row._count.status
    }

    const aiMap: Record<string, number> = {}
    for (const row of aiBreakdown) {
      if (row.aiClassification) {
        aiMap[row.aiClassification] = row._count.aiClassification
      }
    }

    return {
      funnel,
      totalRevenue: Number(revenueData._sum.estimatedValue ?? 0),
      totalPatients: Object.values(funnel).reduce((a, b) => a + b, 0),
      activeCampaigns,
      timeline: timeline.map((t) => ({ date: t.date, count: Number(t.count) })),
      aiBreakdown: {
        interested: aiMap['interested'] ?? 0,
        not_interested: aiMap['not_interested'] ?? 0,
        question: aiMap['question'] ?? 0,
        reschedule: aiMap['reschedule'] ?? 0,
        opt_out: aiMap['opt_out'] ?? 0,
        other: aiMap['other'] ?? 0,
      },
    }
  })
}
