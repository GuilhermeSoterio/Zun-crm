import { env } from '../../config/env'

interface SendTextResponse {
  key: { id: string }
  status: string
}

interface InstanceStatus {
  state: 'open' | 'close' | 'connecting'
}

export const evolutionClient = {
  async sendText(instanceId: string, phone: string, text: string): Promise<string> {
    const res = await fetch(
      `${env.EVOLUTION_API_URL}/message/sendText/${instanceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': env.EVOLUTION_API_KEY,
        },
        body: JSON.stringify({ number: phone, text }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Evolution API erro ${res.status}: ${err}`)
    }

    const data = await res.json() as SendTextResponse
    return data.key.id
  },

  async createInstance(instanceName: string, webhookUrl: string): Promise<{ qrCode?: string }> {
    const res = await fetch(`${env.EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': env.EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        webhook: {
          enabled: true,
          url: webhookUrl,
          events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE'],
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Falha ao criar instância: ${err}`)
    }

    return res.json() as Promise<{ qrCode?: string }>
  },

  async getConnectionStatus(instanceId: string): Promise<InstanceStatus['state']> {
    const res = await fetch(
      `${env.EVOLUTION_API_URL}/instance/connectionState/${instanceId}`,
      { headers: { 'apikey': env.EVOLUTION_API_KEY } }
    )

    if (!res.ok) return 'close'
    const data = await res.json() as { instance: InstanceStatus }
    return data.instance.state
  },
}
