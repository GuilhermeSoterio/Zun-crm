'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, MessageCircle, TrendingUp, DollarSign, X } from 'lucide-react'
import { api } from '@/lib/api-client'
import type { CampaignPatientRow } from '@reativa/shared'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:     { label: 'Aguardando', color: '#64748b',         bg: 'rgba(100,116,139,0.10)' },
  IN_PROGRESS: { label: 'Em contato', color: 'var(--info)',     bg: 'var(--info-muted)' },
  RESPONDED:   { label: 'Respondeu',  color: 'var(--warning)',  bg: 'var(--warning-muted)' },
  CONVERTED:   { label: 'Convertido', color: 'var(--success)',  bg: 'var(--success-muted)' },
  OPTED_OUT:   { label: 'Opt-out',    color: 'var(--danger)',   bg: 'var(--danger-muted)' },
  FAILED:      { label: 'Falhou',     color: 'var(--danger)',   bg: 'var(--danger-muted)' },
}

const ALL_STATUSES = ['', 'PENDING', 'IN_PROGRESS', 'RESPONDED', 'CONVERTED']
const STATUS_LABELS: Record<string, string> = {
  '': 'Todos', PENDING: 'Aguardando', IN_PROGRESS: 'Em contato', RESPONDED: 'Respondeu', CONVERTED: 'Convertido',
}

interface ConvertModal { cp: CampaignPatientRow }

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [patients, setPatients] = useState<CampaignPatientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState<ConvertModal | null>(null)
  const [convertValue, setConvertValue] = useState('')
  const [convertNote, setConvertNote] = useState('')
  const [converting, setConverting] = useState(false)
  const [convertError, setConvertError] = useState('')

  function fetchPatients(status: string) {
    setLoading(true)
    const query = status ? `?status=${status}` : ''
    api.get<CampaignPatientRow[]>(`/campaigns/${id}/patients${query}`)
      .then(setPatients).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchPatients(statusFilter) }, [id, statusFilter])

  async function handleConvert() {
    if (!modal) return
    setConverting(true)
    setConvertError('')
    try {
      await api.patch(`/campaigns/${id}/patients/${modal.cp.id}/convert`, {
        actualValue: Number(convertValue),
        ...(convertNote ? { note: convertNote } : {}),
      })
      setModal(null)
      setConvertValue('')
      setConvertNote('')
      fetchPatients(statusFilter)
    } catch (err: any) {
      setConvertError(err.message)
    } finally {
      setConverting(false)
    }
  }

  function openModal(cp: CampaignPatientRow) {
    setConvertValue(cp.estimatedValue ? String(cp.estimatedValue) : '')
    setConvertNote('')
    setConvertError('')
    setModal({ cp })
  }

  const totalConverted = patients.filter((p) => p.status === 'CONVERTED').length
  const totalRevenue = patients.filter((p) => p.status === 'CONVERTED')
    .reduce((s, p) => s + (p.actualValue ?? p.estimatedValue ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/campaigns')}
          className="flex items-center gap-1.5 text-sm transition-colors hover:underline"
          style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={15} /> Campanhas
        </button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Pacientes da Campanha</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Acompanhe e converta pacientes que responderam</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--success-muted)' }}>
            <CheckCircle2 size={18} style={{ color: 'var(--success)' }} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalConverted}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Convertidos</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--success-muted)' }}>
            <TrendingUp size={18} style={{ color: 'var(--success)' }} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
              {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Receita confirmada</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {ALL_STATUSES.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={statusFilter === s
              ? { background: 'var(--primary)', color: 'white' }
              : { background: 'rgba(15,23,42,0.06)', color: 'var(--text-secondary)' }}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-sm py-8" style={{ color: 'var(--text-muted)' }}>
          <div className="w-4 h-4 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          Carregando...
        </div>
      ) : patients.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--primary-muted)' }}>
              <MessageCircle size={22} style={{ color: 'var(--primary)' }} strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum paciente encontrado com esse filtro.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--card-border)', background: 'rgba(15,23,42,0.02)' }}>
                {['Paciente', 'Procedimento', 'Status', 'Valor est.', 'Valor real', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((cp) => {
                const st = statusConfig[cp.status] ?? statusConfig.PENDING
                return (
                  <tr key={cp.id} className="border-b last:border-0 transition-colors"
                    style={{ borderColor: 'var(--card-border)' }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(15,23,42,0.02)'}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = ''}>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{cp.patientName}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{cp.inactiveDays}d inativo</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {cp.lastProcedure || '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full w-fit"
                        style={{ color: st.color, background: st.bg }}>
                        <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: st.color }} />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {cp.estimatedValue
                        ? cp.estimatedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      {cp.actualValue ? (
                        <span className="font-semibold text-sm" style={{ color: 'var(--success)' }}>
                          {cp.actualValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      ) : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      {(cp.status === 'RESPONDED' || cp.status === 'IN_PROGRESS') && (
                        <button onClick={() => openModal(cp)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:-translate-y-0.5"
                          style={{ background: 'var(--success)', boxShadow: '0 2px 8px rgba(5,150,105,0.25)' }}>
                          <CheckCircle2 size={12} strokeWidth={2.5} /> Converteu
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal — glass claro */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.35)' }}>
          <div className="glass rounded-2xl p-7 w-full max-w-md space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Marcar como Convertido</h3>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{modal.cp.patientName}</p>
              </div>
              <button onClick={() => setModal(null)} className="transition-colors mt-0.5"
                style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {convertError && (
              <div className="rounded-xl p-3 text-sm"
                style={{ background: 'var(--danger-muted)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.15)' }}>
                {convertError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Valor real do agendamento (R$)
              </label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input type="number" value={convertValue} onChange={(e) => setConvertValue(e.target.value)}
                  placeholder={modal.cp.estimatedValue ? String(modal.cp.estimatedValue) : '0'}
                  className="input-base pl-8" autoFocus />
              </div>
              {modal.cp.estimatedValue && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                  Estimado: {modal.cp.estimatedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Observação <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span>
              </label>
              <input type="text" value={convertNote} onChange={(e) => setConvertNote(e.target.value)}
                placeholder="Ex: Botox + limpeza de pele" className="input-base" />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setModal(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-slate-50"
                style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>
                Cancelar
              </button>
              <button onClick={handleConvert} disabled={!convertValue || converting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--success)', boxShadow: converting ? 'none' : '0 4px 14px rgba(5,150,105,0.3)' }}>
                <CheckCircle2 size={15} strokeWidth={2.5} />
                {converting ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
