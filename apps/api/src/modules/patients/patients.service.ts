import { prisma } from '../../config/database'
import { decrypt } from '../../crypto/encrypt'

export async function listPatientsWithCadence(clinicId: string) {
  const patients = await prisma.patient.findMany({
    where: { clinicId, optedOut: false },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      nameEncrypted: true,
      phoneEncrypted: true,
      lastAppointmentDate: true,
      lastProcedure: true,
      inactiveDays: true,
      tags: true,
      campaignPatients: {
        orderBy: { updatedAt: 'desc' },
        take: 1,
        select: {
          id: true,
          status: true,
          currentStep: true,
          estimatedValue: true,
          actualValue: true,
          campaign: {
            select: { id: true, name: true },
          },
        },
      },
    },
  })

  return patients.map((p) => {
    const cp = p.campaignPatients[0] ?? null
    return {
      id: p.id,
      name: decrypt(p.nameEncrypted, clinicId),
      phone: decrypt(p.phoneEncrypted, clinicId),
      lastAppointmentDate: p.lastAppointmentDate?.toISOString() ?? null,
      lastProcedure: p.lastProcedure,
      inactiveDays: p.inactiveDays,
      tags: p.tags,
      campaignStatus: cp?.status ?? null,
      campaignId: cp?.campaign.id ?? null,
      campaignName: cp?.campaign.name ?? null,
      campaignPatientId: cp?.id ?? null,
      currentStep: cp?.currentStep ?? 0,
      estimatedValue: cp?.estimatedValue ? Number(cp.estimatedValue) : null,
      actualValue: cp?.actualValue ? Number(cp.actualValue) : null,
    }
  })
}
