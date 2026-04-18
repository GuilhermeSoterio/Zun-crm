import './config/env' // Valida env antes de tudo
import { startWhatsappWorker } from './workers/whatsapp.worker'
import { startAiClassifyWorker } from './workers/ai-classify.worker'
import { startImportWorker } from './workers/import.worker'

console.log('[Workers] Iniciando workers...')

startWhatsappWorker()
startAiClassifyWorker()
startImportWorker()

console.log('[Workers] Todos os workers iniciados')

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Workers] Encerrando...')
  process.exit(0)
})
