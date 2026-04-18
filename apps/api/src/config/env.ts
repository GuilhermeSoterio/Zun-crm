import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_MASTER_KEY: z.string().length(64), // 32 bytes em hex
  ANTHROPIC_API_KEY: z.string().min(1),
  EVOLUTION_API_URL: z.string().url().default('http://localhost:8080'),
  EVOLUTION_API_KEY: z.string().min(1),
  CLOUDFLARE_R2_ENDPOINT: z.string().url().optional(),
  CLOUDFLARE_R2_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_R2_SECRET_KEY: z.string().optional(),
  CLOUDFLARE_R2_BUCKET: z.string().optional(),
  WEBHOOK_BASE_URL: z.string().url(),
})

function parseEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('Variáveis de ambiente inválidas:', result.error.flatten().fieldErrors)
    process.exit(1)
  }
  return result.data
}

export const env = parseEnv()
export type Env = typeof env
