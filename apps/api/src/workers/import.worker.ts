import { Worker, Job } from 'bullmq'
import { redis } from '../config/redis'
import { prisma } from '../config/database'
import { encrypt, hashPhone } from '../crypto/encrypt'
import { normalizePhone } from '../utils/phone'
import Papa from 'papaparse'
import { differenceInDays } from '../utils/date'

interface ImportJobData {
  importJobId: string
  clinicId: string
  csvContent: string // conteúdo do CSV (em dev, sem R2)
  fieldMapping: {
    name: string
    phone: string
    lastAppointmentDate?: string
    lastProcedure?: string
  }
}

async function processImportJob(job: Job<ImportJobData>) {
  const { importJobId, clinicId, csvContent, fieldMapping } = job.data

  await prisma.importJob.update({
    where: { id: importJobId },
    data: { status: 'PROCESSING' },
  })

  const rows: Record<string, string>[] = []
  Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    complete: (result) => rows.push(...(result.data as Record<string, string>[])),
  })

  await prisma.importJob.update({
    where: { id: importJobId },
    data: { totalRows: rows.length },
  })

  let processed = 0
  let errors = 0
  const errorLog: { row: number; error: string }[] = []

  const CHUNK_SIZE = 100
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE)

    for (const [idx, row] of chunk.entries()) {
      const rowNumber = i + idx + 2 // +2: header + 1-indexed

      const rawName = row[fieldMapping.name]?.trim()
      const rawPhone = row[fieldMapping.phone]?.trim()

      if (!rawName || !rawPhone) {
        errors++
        errorLog.push({ row: rowNumber, error: 'Nome ou telefone vazio' })
        continue
      }

      const phone = normalizePhone(rawPhone)
      if (!phone) {
        errors++
        errorLog.push({ row: rowNumber, error: `Telefone inválido: ${rawPhone}` })
        continue
      }

      const rawDate = fieldMapping.lastAppointmentDate ? row[fieldMapping.lastAppointmentDate] : null
      const lastAppointmentDate = rawDate ? new Date(rawDate) : null
      const inactiveDays = lastAppointmentDate ? differenceInDays(new Date(), lastAppointmentDate) : null
      const lastProcedure = fieldMapping.lastProcedure ? row[fieldMapping.lastProcedure]?.trim() || null : null

      try {
        await prisma.patient.upsert({
          where: { clinicId_phoneHash: { clinicId, phoneHash: hashPhone(phone) } },
          create: {
            clinicId,
            nameEncrypted: encrypt(rawName, clinicId),
            phoneEncrypted: encrypt(phone, clinicId),
            phoneHash: hashPhone(phone),
            lastAppointmentDate,
            lastProcedure,
            inactiveDays,
          },
          update: {
            nameEncrypted: encrypt(rawName, clinicId),
            lastAppointmentDate: lastAppointmentDate ?? undefined,
            lastProcedure: lastProcedure ?? undefined,
            inactiveDays: inactiveDays ?? undefined,
          },
        })
        processed++
      } catch (err: any) {
        errors++
        errorLog.push({ row: rowNumber, error: err.message })
      }
    }

    // Atualiza progresso a cada chunk
    await prisma.importJob.update({
      where: { id: importJobId },
      data: { processedRows: processed, errorRows: errors },
    })
  }

  await prisma.importJob.update({
    where: { id: importJobId },
    data: {
      status: errors === rows.length ? 'FAILED' : 'COMPLETED',
      processedRows: processed,
      errorRows: errors,
      errorLog: errorLog.length > 0 ? errorLog : undefined,
      completedAt: new Date(),
    },
  })

  console.log(`[Import Worker] Job ${importJobId}: ${processed} importados, ${errors} erros`)
}

export function startImportWorker() {
  const worker = new Worker<ImportJobData>('import-process', processImportJob, {
    connection: redis,
    concurrency: 5,
  })

  worker.on('failed', (job, err) => {
    console.error(`[Import Worker] Job ${job?.id} falhou:`, err.message)
    if (job?.data.importJobId) {
      prisma.importJob.update({
        where: { id: job.data.importJobId },
        data: { status: 'FAILED' },
      }).catch(console.error)
    }
  })

  console.log('[Import Worker] Iniciado')
  return worker
}
