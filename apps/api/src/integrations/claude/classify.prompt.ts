import Anthropic from '@anthropic-ai/sdk'
import { env } from '../../config/env'
import type { AiClassification } from '@reativa/shared'

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Você é um classificador de intenção para respostas de pacientes de clínicas médicas.
Analise a mensagem e retorne um JSON com:
- intent: "interested" | "not_interested" | "question" | "reschedule" | "opt_out" | "other"
- confidence: número de 0 a 1
- reasoning: frase curta explicando a classificação

Regras:
- "interested": paciente quer marcar/confirmar consulta agora
- "not_interested": recusa clara
- "question": pergunta sobre preço, disponibilidade, procedimento
- "reschedule": quer mas em outro momento específico
- "opt_out": pede para parar de receber mensagens (palavras como SAIR, PARAR, CANCELAR, NÃO QUERO)
- "other": ambíguo ou fora de contexto

Responda APENAS com o JSON, sem markdown.`

export interface ClassificationResult {
  intent: AiClassification
  confidence: number
  reasoning: string
}

export async function classifyMessage(messageText: string): Promise<ClassificationResult> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: messageText },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'

  try {
    return JSON.parse(text) as ClassificationResult
  } catch {
    return { intent: 'other', confidence: 0, reasoning: 'Falha no parse da resposta' }
  }
}
