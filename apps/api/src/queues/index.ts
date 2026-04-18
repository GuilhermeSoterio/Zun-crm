import { Queue } from 'bullmq'
import { redis } from '../config/redis'

const connection = redis

export const whatsappQueue = new Queue('whatsapp-send', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
})

export const aiClassifyQueue = new Queue('ai-classify', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 2000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 },
  },
})

export const importQueue = new Queue('import-process', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
})
