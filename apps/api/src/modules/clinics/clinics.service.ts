import { prisma } from '../../config/database'

export async function listProcedurePrices(clinicId: string) {
  return prisma.procedurePrice.findMany({
    where: { clinicId },
    orderBy: { procedureName: 'asc' },
    select: { id: true, procedureName: true, price: true },
  })
}

export async function upsertProcedurePrice(
  clinicId: string,
  procedureName: string,
  price: number
) {
  return prisma.procedurePrice.upsert({
    where: { clinicId_procedureName: { clinicId, procedureName } },
    create: { clinicId, procedureName, price },
    update: { price },
    select: { id: true, procedureName: true, price: true },
  })
}

export async function deleteProcedurePrice(clinicId: string, id: string) {
  const existing = await prisma.procedurePrice.findFirst({ where: { id, clinicId } })
  if (!existing) throw new Error('Preço não encontrado')
  await prisma.procedurePrice.delete({ where: { id } })
}
