import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

export function normalizePhone(raw: string): string | null {
  // Remove caracteres não numéricos
  const digits = raw.replace(/\D/g, '')

  // Tenta parsear como número brasileiro
  try {
    let phone = digits
    // Se não tem código do país, adiciona +55
    if (!phone.startsWith('55')) {
      phone = '55' + phone
    }
    if (isValidPhoneNumber('+' + phone, 'BR')) {
      const parsed = parsePhoneNumber('+' + phone, 'BR')
      // Retorna no formato E.164 sem o +: 5511999999999
      return parsed.format('E.164').replace('+', '')
    }
    return null
  } catch {
    return null
  }
}
