'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ChevronRight, Rocket, Users } from 'lucide-react'
import { api } from '@/lib/api-client'

const DEFAULT_TEMPLATES = [
  { stepNumber: 1 as const, delayDays: 0 as const, templateBody: 'Olá {{nome_paciente}}! 😊 Aqui é da {{nome_clinica}}. Notamos que faz um tempo desde sua última visita ({{ultimo_procedimento}}). Que tal agendar uma avaliação? Estamos com horários disponíveis essa semana!' },
  { stepNumber: 2 as const, delayDays: 3 as const, templateBody: 'Oi {{nome_paciente}}, tudo bem? Ainda temos horários disponíveis para você! Manter a saúde em dia é importante. Posso te ajudar a agendar?' },
  { stepNumber: 3 as const, delayDays: 7 as const, templateBody: '{{nome_paciente}}, última mensagem! 🌟 Temos uma condição especial para pacientes que retornam. Aproveite e agende ainda essa semana. Responda "SIM" que entramos em contato!' },
]

const STEPS = ['Configurar', 'Mensagens', 'Revisar']

export default function NewCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: '', avgTicket: '',
    filter: { inactiveDays: 180, procedures: [] as string[], tags: [] as string[] },
    sequences: DEFAULT_TEMPLATES,
  })

  async function loadPreview() {
    const count = await api.post<{ count: number }>('/campaigns/preview', { targetFilter: form.filter })
    setPreviewCount(count.count)
  }

  async function handleCreate() {
    setLoading(true)
    setError('')
    try {
      await api.post('/campaigns', { name: form.name, targetFilter: form.filter, sequences: form.sequences, avgTicket: Number(form.avgTicket) })
      router.push('/campaigns')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Nova Campanha</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Configure e ative sua campanha de reativação</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={step === i+1 ? { background: 'var(--primary)', color: 'white' }
                  : step > i+1 ? { background: 'var(--success)', color: 'white' }
                  : { background: 'rgba(15,23,42,0.07)', color: 'var(--text-muted)' }}>
                {step > i+1 ? <CheckCircle2 size={14} /> : i+1}
              </div>
              <span className="text-sm font-medium"
                style={{ color: step === i+1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label}</span>
            </div>
            {i < STEPS.length-1 && <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} className="mx-1" />}
          </div>
        ))}
      </div>

      <div className="card p-7 space-y-5">
        {error && (
          <div className="rounded-xl p-3 text-sm"
            style={{ background: 'var(--danger-muted)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.15)' }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nome da campanha</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Reativação Limpeza Semestral" className="input-base" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Ticket médio (R$)</label>
              <input type="number" value={form.avgTicket} onChange={(e) => setForm({ ...form, avgTicket: e.target.value })}
                placeholder="Ex: 250" className="input-base" />
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                Fallback — se o procedimento do paciente tiver preço cadastrado, ele será usado.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Pacientes inativos há pelo menos</label>
              <select value={form.filter.inactiveDays}
                onChange={(e) => setForm({ ...form, filter: { ...form.filter, inactiveDays: Number(e.target.value) } })}
                className="input-base">
                <option value={90}>90 dias (3 meses)</option>
                <option value={180}>180 dias (6 meses)</option>
                <option value={365}>365 dias (1 ano)</option>
                <option value={730}>730 dias (2 anos)</option>
              </select>
            </div>
            <button onClick={loadPreview} className="flex items-center gap-2 text-sm font-medium"
              style={{ color: 'var(--primary)' }}>
              <Users size={14} strokeWidth={2} />
              Ver quantos pacientes serão impactados
            </button>
            {previewCount !== null && (
              <div className="flex items-center gap-2 rounded-xl p-3 text-sm font-medium"
                style={{ background: 'var(--success-muted)', color: 'var(--success)' }}>
                <CheckCircle2 size={15} strokeWidth={2.5} />
                {previewCount} pacientes elegíveis encontrados
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Use{' '}
              {['{{nome_paciente}}', '{{ultimo_procedimento}}', '{{nome_clinica}}'].map((v) => (
                <code key={v} className="px-1.5 py-0.5 rounded text-xs font-mono mx-0.5"
                  style={{ background: 'var(--primary-muted)', color: 'var(--primary)' }}>{v}</code>
              ))}
              {' '}como variáveis.
            </p>
            {form.sequences.map((seq, i) => (
              <div key={i} className="rounded-xl border p-4 space-y-2.5"
                style={{ borderColor: 'var(--card-border)', background: 'rgba(15,23,42,0.02)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--primary-muted)', color: 'var(--primary)' }}>
                    Dia {seq.delayDays === 0 ? '1' : seq.delayDays}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Mensagem {seq.stepNumber}</span>
                </div>
                <textarea value={seq.templateBody}
                  onChange={(e) => { const u = [...form.sequences]; u[i] = { ...u[i], templateBody: e.target.value }; setForm({ ...form, sequences: u }) }}
                  rows={4} className="input-base resize-none" />
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Resumo da campanha</h3>
            <div className="space-y-0">
              {[
                ['Nome', form.name],
                ['Inativos há', `${form.filter.inactiveDays} dias`],
                ['Pacientes elegíveis', previewCount != null ? `${previewCount}` : '—'],
                ['Ticket médio', Number(form.avgTicket).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
                ['Sequência', `${form.sequences.length} mensagens (Dia 1, 3 e 7)`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-2.5 border-b last:border-0"
                  style={{ borderColor: 'var(--card-border)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-3.5 text-sm mt-1"
              style={{ background: 'var(--warning-muted)', color: 'var(--warning)', border: '1px solid rgba(217,119,6,0.15)' }}>
              Ao ativar, as mensagens começarão a ser enviadas imediatamente. Verifique se o WhatsApp está conectado em Configurações.
            </div>
          </div>
        )}

        <div className="flex justify-between pt-2">
          <button onClick={() => step > 1 && setStep(step - 1)} disabled={step === 1}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors disabled:opacity-30 hover:bg-slate-50"
            style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>
            Voltar
          </button>
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} disabled={step === 1 && (!form.name || !form.avgTicket)}
              className="btn-primary flex items-center gap-2">
              Próximo <ChevronRight size={15} />
            </button>
          ) : (
            <button onClick={handleCreate} disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all hover:-translate-y-0.5"
              style={{ background: 'var(--success)', boxShadow: loading ? 'none' : '0 4px 14px rgba(5,150,105,0.3)' }}>
              <Rocket size={15} />
              {loading ? 'Ativando...' : 'Ativar Campanha'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
