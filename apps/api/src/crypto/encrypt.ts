import { createCipheriv, createDecipheriv, createHmac, randomBytes, createHash } from 'crypto'
import { env } from '../config/env'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function deriveClinicKey(clinicId: string): Buffer {
  // HKDF simplificado: HMAC-SHA256(masterKey, clinicId)
  const masterKey = Buffer.from(env.ENCRYPTION_MASTER_KEY, 'hex')
  return createHmac('sha256', masterKey).update(clinicId).digest()
}

export function encrypt(plaintext: string, clinicId: string): string {
  const key = deriveClinicKey(clinicId)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  // Formato: base64(iv + authTag + ciphertext)
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

export function decrypt(ciphertext: string, clinicId: string): string {
  const key = deriveClinicKey(clinicId)
  const buf = Buffer.from(ciphertext, 'base64')

  const iv = buf.subarray(0, IV_LENGTH)
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  return decipher.update(encrypted) + decipher.final('utf8')
}

export function hashPhone(phone: string): string {
  return createHash('sha256').update(phone).digest('hex')
}
