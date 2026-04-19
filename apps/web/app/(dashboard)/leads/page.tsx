'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  UserPlus,
  Plus,
  SlidersHorizontal,
  X,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronDown,
  Trophy,
  ThumbsDown,
  Clock,
  DollarSign,
  Phone,
  Mail,
  Tag,
  FileText,
  Check,
  AlertCircle,
} from 'lucide-react'
import { api } from '@/lib/api-client'
import type { FunnelWithStages, LeadKanbanRow, LeadDetail, FunnelStage } from '@reativa/shared'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  instagram: 'Instagram',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  indicacao: 'Indicação',
  site: 'Site',
}

const LOST_REASONS = ['Preço', 'Concorrência', 'Sem resposta', 'Não tem interesse', 'Outro']

const COLOR_PALETTE = [
  '#64748b', '#8b5cf6', '#6366f1', '#0284c7', '#0891b2',
  '#059669', '#65a30d', '#d97706', '#ea580c', '#dc2626', '#db2777',
]

function rgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, '')
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  return phone
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

function LeadCard({ lead, stage, onClick }: { lead: LeadKanbanRow; stage: FunnelStage; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full card p-3 flex flex-col gap-2 hover:shadow-md transition-all text-left"
      style={{ borderLeft: `3px solid ${stage.color}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-[13px] leading-tight" style={{ color: 'var(--text-primary)' }}>
          {lead.name}
        </p>
        {lead.source && (
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
            style={{ background: rgba(stage.color, 0.1), color: stage.color }}
          >
            {SOURCE_LABELS[lead.source] ?? lead.source}
          </span>
        )}
      </div>

      <div className="space-y-0.5">
        {lead.phone && (
          <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Phone size={10} /> {formatPhone(lead.phone)}
          </p>
        )}
        {lead.email && (
          <p className="text-[11px] flex items-center gap-1 truncate" style={{ color: 'var(--text-muted)' }}>
            <Mail size={10} /> {lead.email}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <Clock size={10} /> {lead.daysInStage}d nesta etapa
        </span>
        {lead.estimatedValue != null && (
          <span className="text-[11px] font-bold" style={{ color: 'var(--success)' }}>
            {lead.estimatedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        )}
      </div>
    </button>
  )
}

// ─── New Lead Modal ───────────────────────────────────────────────────────────

function NewLeadModal({ funnel, onClose, onCreated }: {
  funnel: FunnelWithStages
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', source: 'manual', estimatedValue: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const firstStage = funnel.stages.find((s) => !s.isWon && !s.isLost)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/leads', {
        funnelId: funnel.id,
        stageId: firstStage?.id,
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        source: form.source,
        notes: form.notes || undefined,
        estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
      })
      onCreated()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl flex flex-col" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
            <h3 className="font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>Novo Lead</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgba(15,23,42,0.06)]">
              <X size={16} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>

          <form onSubmit={submit} className="p-5 space-y-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Nome *</label>
              <input
                className="input-base text-sm w-full"
                placeholder="Nome completo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Telefone</label>
                <input
                  className="input-base text-sm w-full"
                  placeholder="(11) 99999-9999"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Valor est. (R$)</label>
                <input
                  className="input-base text-sm w-full"
                  type="number"
                  placeholder="0,00"
                  value={form.estimatedValue}
                  onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Email</label>
              <input
                className="input-base text-sm w-full"
                type="email"
                placeholder="email@exemplo.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Origem</label>
              <select
                className="input-base text-sm w-full"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              >
                {Object.entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Observações</label>
              <textarea
                className="input-base text-sm w-full resize-none"
                rows={2}
                placeholder="Notas sobre o lead..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2 rounded-xl text-sm font-medium border"
                style={{ color: 'var(--text-muted)', borderColor: 'var(--card-border)' }}>
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'var(--primary)', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Salvando...' : 'Criar Lead'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

// ─── Lead Detail Panel ────────────────────────────────────────────────────────

function LeadDetailPanel({ leadId, funnel, onClose, onRefresh }: {
  leadId: string
  funnel: FunnelWithStages
  onClose: () => void
  onRefresh: () => void
}) {
  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [showWinModal, setShowWinModal] = useState(false)
  const [showLoseModal, setShowLoseModal] = useState(false)
  const [showStageMenu, setShowStageMenu] = useState(false)
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    api.get<LeadDetail>(`/leads/${leadId}`).then(setLead)
  }, [leadId])

  async function moveStage(stageId: string) {
    await api.patch(`/leads/${leadId}/stage`, { stageId })
    setShowStageMenu(false)
    const updated = await api.get<LeadDetail>(`/leads/${leadId}`)
    setLead(updated)
    onRefresh()
  }

  async function addNote() {
    if (!note.trim()) return
    setSavingNote(true)
    await api.patch(`/leads/${leadId}`, { notes: note })
    const updated = await api.get<LeadDetail>(`/leads/${leadId}`)
    setLead(updated)
    setNote('')
    setSavingNote(false)
  }

  const activeStages = funnel.stages.filter((s) => !s.isWon && !s.isLost)
  const currentStage = funnel.stages.find((s) => s.id === lead?.stageId)

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={onClose} />
      <div className="fixed top-0 right-0 h-full z-50 flex flex-col w-96"
        style={{ background: 'var(--card)', borderLeft: '1px solid var(--card-border)', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>

        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <h3 className="font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>
            {lead?.name ?? '...'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgba(15,23,42,0.06)]">
            <X size={16} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {!lead ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Actions */}
            <div className="px-5 py-4 border-b flex gap-2" style={{ borderColor: 'var(--card-border)' }}>
              {lead.status === 'ACTIVE' && (
                <>
                  <div className="relative flex-1">
                    <button
                      onClick={() => setShowStageMenu(!showStageMenu)}
                      className="w-full flex items-center justify-between gap-1 px-3 py-2 rounded-lg text-[12px] font-medium border"
                      style={{ color: currentStage?.color ?? 'var(--text-muted)', borderColor: currentStage?.color ?? 'var(--card-border)', background: rgba(currentStage?.color ?? '#000', 0.06) }}
                    >
                      <span>{currentStage?.name ?? 'Mover etapa'}</span>
                      <ChevronDown size={12} />
                    </button>
                    {showStageMenu && (
                      <div className="absolute top-full left-0 mt-1 w-full rounded-xl border py-1 z-10"
                        style={{ background: 'var(--card)', borderColor: 'var(--card-border)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                        {activeStages.map((s) => (
                          <button key={s.id} onClick={() => moveStage(s.id)}
                            className="w-full text-left px-3 py-2 text-[12px] font-medium flex items-center gap-2 hover:bg-[rgba(15,23,42,0.04)]"
                            style={{ color: s.color }}>
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                            {s.name}
                            {s.id === lead.stageId && <Check size={11} className="ml-auto" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setShowWinModal(true)}
                    className="px-3 py-2 rounded-lg text-[12px] font-semibold text-white flex items-center gap-1"
                    style={{ background: 'var(--success)' }}>
                    <Trophy size={12} /> Ganho
                  </button>
                  <button onClick={() => setShowLoseModal(true)}
                    className="px-3 py-2 rounded-lg text-[12px] font-semibold text-white flex items-center gap-1"
                    style={{ background: 'var(--danger)' }}>
                    <ThumbsDown size={12} /> Perdido
                  </button>
                </>
              )}
              {lead.status === 'WON' && (
                <span className="px-3 py-2 rounded-lg text-[12px] font-semibold text-white flex items-center gap-1"
                  style={{ background: 'var(--success)' }}>
                  <Trophy size={12} /> Ganho
                </span>
              )}
              {lead.status === 'LOST' && (
                <span className="px-3 py-2 rounded-lg text-[12px] font-semibold text-white flex items-center gap-1"
                  style={{ background: 'var(--danger)' }}>
                  <ThumbsDown size={12} /> Perdido{lead.lostReason ? ` · ${lead.lostReason}` : ''}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="px-5 py-4 space-y-2 border-b" style={{ borderColor: 'var(--card-border)' }}>
              {lead.phone && (
                <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  <Phone size={13} style={{ color: 'var(--text-muted)' }} />
                  {formatPhone(lead.phone)}
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  <Mail size={13} style={{ color: 'var(--text-muted)' }} />
                  {lead.email}
                </div>
              )}
              {lead.source && (
                <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  <Tag size={13} style={{ color: 'var(--text-muted)' }} />
                  {SOURCE_LABELS[lead.source] ?? lead.source}
                </div>
              )}
              {lead.estimatedValue != null && (
                <div className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: 'var(--success)' }}>
                  <DollarSign size={13} />
                  {lead.estimatedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              )}
            </div>

            {/* Notes */}
            {lead.notes && (
              <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
                <p className="text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>NOTAS</p>
                <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{lead.notes}</p>
              </div>
            )}

            {/* Add note */}
            {lead.status === 'ACTIVE' && (
              <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
                <div className="flex gap-2">
                  <input
                    className="input-base text-sm flex-1"
                    placeholder="Adicionar nota..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addNote()}
                  />
                  <button onClick={addNote} disabled={savingNote || !note.trim()}
                    className="px-3 py-2 rounded-lg text-[12px] font-medium text-white"
                    style={{ background: 'var(--primary)', opacity: (!note.trim() || savingNote) ? 0.5 : 1 }}>
                    <FileText size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="px-5 py-4">
              <p className="text-[11px] font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>ATIVIDADES</p>
              <div className="space-y-3">
                {lead.activities.map((a) => (
                  <div key={a.id} className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--primary)' }} />
                    <div>
                      <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                        {a.type === 'created' && 'Lead criado'}
                        {a.type === 'stage_change' && `Movido: ${(a.data as any)?.fromStage} → ${(a.data as any)?.toStage}`}
                        {a.type === 'won' && `Marcado como Ganho${(a.data as any)?.actualValue ? ` · R$ ${(a.data as any).actualValue}` : ''}`}
                        {a.type === 'lost' && `Marcado como Perdido${(a.data as any)?.reason ? ` · ${(a.data as any).reason}` : ''}`}
                        {a.type === 'note' && 'Nota adicionada'}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {new Date(a.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Win Modal */}
      {showWinModal && (
        <WinModal
          leadId={leadId}
          onClose={() => setShowWinModal(false)}
          onDone={() => { setShowWinModal(false); onClose(); onRefresh() }}
        />
      )}
      {/* Lose Modal */}
      {showLoseModal && (
        <LoseModal
          leadId={leadId}
          onClose={() => setShowLoseModal(false)}
          onDone={() => { setShowLoseModal(false); onClose(); onRefresh() }}
        />
      )}
    </>
  )
}

// ─── Win Modal ────────────────────────────────────────────────────────────────

function WinModal({ leadId, onClose, onDone }: { leadId: string; onClose: () => void; onDone: () => void }) {
  const [actualValue, setActualValue] = useState('')
  const [createPatient, setCreatePatient] = useState(true)
  const [saving, setSaving] = useState(false)

  async function confirm() {
    setSaving(true)
    try {
      await api.patch(`/leads/${leadId}/win`, {
        actualValue: actualValue ? Number(actualValue) : undefined,
        createPatient,
      })
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[60]" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl p-6 space-y-4"
          style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: rgba('#059669', 0.1) }}>
              <Trophy size={20} style={{ color: '#059669' }} />
            </div>
            <div>
              <h3 className="font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>Marcar como Ganho</h3>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Registre o fechamento</p>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Valor real (R$)</label>
            <input
              className="input-base text-sm w-full"
              type="number"
              placeholder="Valor fechado"
              value={actualValue}
              onChange={(e) => setActualValue(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={createPatient} onChange={(e) => setCreatePatient(e.target.checked)}
              className="w-4 h-4 rounded" />
            <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              Converter em paciente automaticamente
            </span>
          </label>

          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-2 rounded-xl text-sm font-medium border"
              style={{ color: 'var(--text-muted)', borderColor: 'var(--card-border)' }}>
              Cancelar
            </button>
            <button onClick={confirm} disabled={saving}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#059669', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Salvando...' : 'Confirmar Ganho'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Lose Modal ───────────────────────────────────────────────────────────────

function LoseModal({ leadId, onClose, onDone }: { leadId: string; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  async function confirm() {
    setSaving(true)
    try {
      await api.patch(`/leads/${leadId}/lose`, { reason: reason || undefined })
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[60]" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl p-6 space-y-4"
          style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: rgba('#dc2626', 0.1) }}>
              <ThumbsDown size={20} style={{ color: '#dc2626' }} />
            </div>
            <div>
              <h3 className="font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>Marcar como Perdido</h3>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Informe o motivo</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {LOST_REASONS.map((r) => (
              <button key={r} onClick={() => setReason(r)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all"
                style={{
                  background: reason === r ? rgba('#dc2626', 0.1) : 'transparent',
                  color: reason === r ? '#dc2626' : 'var(--text-muted)',
                  borderColor: reason === r ? '#dc262640' : 'var(--card-border)',
                }}>
                {r}
              </button>
            ))}
          </div>

          <input
            className="input-base text-sm w-full"
            placeholder="Ou descreva o motivo..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-2 rounded-xl text-sm font-medium border"
              style={{ color: 'var(--text-muted)', borderColor: 'var(--card-border)' }}>
              Cancelar
            </button>
            <button onClick={confirm} disabled={saving}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#dc2626', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Edit Funnel Panel ────────────────────────────────────────────────────────

function EditFunnelPanel({ funnel, onClose, onSaved }: {
  funnel: FunnelWithStages
  onClose: () => void
  onSaved: () => void
}) {
  const [stages, setStages] = useState<FunnelStage[]>(funnel.stages.map((s) => ({ ...s })))
  const [saving, setSaving] = useState(false)
  const [newStageName, setNewStageName] = useState('')

  async function saveStage(stage: FunnelStage) {
    await api.patch(`/funnels/${funnel.id}/stages/${stage.id}`, { name: stage.name, color: stage.color })
  }

  async function addStage() {
    if (!newStageName.trim()) return
    await api.post(`/funnels/${funnel.id}/stages`, { name: newStageName, color: '#64748b' })
    setNewStageName('')
    onSaved()
  }

  async function saveAll() {
    setSaving(true)
    try {
      await Promise.all(stages.map(saveStage))
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={onClose} />
      <div className="fixed top-0 right-0 h-full z-50 flex flex-col w-80"
        style={{ background: 'var(--card)', borderLeft: '1px solid var(--card-border)', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>

        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <div>
            <h3 className="font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>Editar Funil</h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{funnel.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgba(15,23,42,0.06)]">
            <X size={16} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {stages.map((stage) => (
            <div key={stage.id} className="p-3 rounded-xl border space-y-2"
              style={{ borderColor: stage.color + '40', background: rgba(stage.color, 0.04) }}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: stage.color }} />
                <input
                  className="flex-1 text-[13px] font-medium px-2 py-1 rounded-lg border outline-none"
                  style={{ color: 'var(--text-primary)', background: 'var(--background)', borderColor: 'var(--card-border)' }}
                  value={stage.name}
                  onChange={(e) => setStages(stages.map((s) => s.id === stage.id ? { ...s, name: e.target.value } : s))}
                />
              </div>
              <div className="flex gap-1.5 flex-wrap pl-5">
                {COLOR_PALETTE.map((hex) => (
                  <button key={hex} onClick={() => setStages(stages.map((s) => s.id === stage.id ? { ...s, color: hex } : s))}
                    className="w-4 h-4 rounded-full transition-transform hover:scale-110"
                    style={{ background: hex, outline: stage.color === hex ? `2px solid ${hex}` : 'none', outlineOffset: '2px' }} />
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <input
              className="input-base text-sm flex-1"
              placeholder="Nova etapa..."
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addStage()}
            />
            <button onClick={addStage}
              className="px-3 py-2 rounded-lg text-white text-[12px] font-medium"
              style={{ background: 'var(--primary)' }}>
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="p-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <button onClick={saveAll} disabled={saving}
            className="w-full py-2 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: 'var(--primary)', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [funnels, setFunnels] = useState<FunnelWithStages[]>([])
  const [activeFunnelId, setActiveFunnelId] = useState<string | null>(null)
  const [leads, setLeads] = useState<LeadKanbanRow[]>([])
  const [loadingFunnels, setLoadingFunnels] = useState(true)
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [showNewLead, setShowNewLead] = useState(false)
  const [showEditFunnel, setShowEditFunnel] = useState(false)
  const [showNewFunnelInput, setShowNewFunnelInput] = useState(false)
  const [newFunnelName, setNewFunnelName] = useState('')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  const activeFunnel = useMemo(() => funnels.find((f) => f.id === activeFunnelId) ?? null, [funnels, activeFunnelId])

  const loadFunnels = useCallback(async () => {
    setLoadingFunnels(true)
    try {
      const data = await api.get<FunnelWithStages[]>('/funnels')
      setFunnels(data)
      if (!activeFunnelId && data.length > 0) setActiveFunnelId(data[0].id)
    } catch {
      setFunnels([])
    } finally {
      setLoadingFunnels(false)
    }
  }, [activeFunnelId])

  const loadLeads = useCallback(async (funnelId: string) => {
    setLoadingLeads(true)
    try {
      const data = await api.get<LeadKanbanRow[]>(`/leads?funnelId=${funnelId}`)
      setLeads(data)
    } catch {
      setLeads([])
    } finally {
      setLoadingLeads(false)
    }
  }, [])

  useEffect(() => { loadFunnels() }, [])
  useEffect(() => { if (activeFunnelId) loadLeads(activeFunnelId) }, [activeFunnelId])

  async function createFunnel() {
    if (!newFunnelName.trim()) return
    const funnel = await api.post<FunnelWithStages>('/funnels', { name: newFunnelName })
    setNewFunnelName('')
    setShowNewFunnelInput(false)
    await loadFunnels()
    setActiveFunnelId(funnel.id)
  }

  const grouped = useMemo(() => {
    if (!activeFunnel) return new Map<string, LeadKanbanRow[]>()
    const map = new Map<string, LeadKanbanRow[]>()
    activeFunnel.stages.forEach((s) => map.set(s.id, []))
    leads.forEach((l) => map.get(l.stageId)?.push(l))
    return map
  }, [leads, activeFunnel])

  const visibleStages = useMemo(() => activeFunnel?.stages.filter((s) => !s.isLost) ?? [], [activeFunnel])

  const totalValue = useMemo(() =>
    leads.filter((l) => l.status === 'ACTIVE').reduce((sum, l) => sum + (l.estimatedValue ?? 0), 0),
    [leads])

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Leads</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {leads.filter((l) => l.status === 'ACTIVE').length} leads ativos
            {totalValue > 0 && ` · ${totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} estimados`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeFunnel && (
            <button onClick={() => setShowEditFunnel(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors hover:bg-[rgba(15,23,42,0.04)]"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--card-border)', background: 'var(--card)' }}>
              <SlidersHorizontal size={13} /> Editar Funil
            </button>
          )}
          {activeFunnel && (
            <button onClick={() => setShowNewLead(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--primary)' }}>
              <UserPlus size={14} /> Novo Lead
            </button>
          )}
        </div>
      </div>

      {/* Funnel tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {funnels.map((f) => (
          <button key={f.id} onClick={() => setActiveFunnelId(f.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
            style={activeFunnelId === f.id
              ? { background: 'var(--primary)', color: '#fff' }
              : { color: 'var(--text-secondary)', background: 'var(--card)', border: '1px solid var(--card-border)' }
            }>
            <span className="w-2 h-2 rounded-full" style={{ background: activeFunnelId === f.id ? '#fff' : f.color }} />
            {f.name}
            <span className="text-[10px] opacity-70">({f.totalLeads})</span>
          </button>
        ))}

        {showNewFunnelInput ? (
          <div className="flex items-center gap-1 flex-shrink-0">
            <input
              className="input-base text-sm px-2 py-1.5 w-40"
              placeholder="Nome do funil"
              value={newFunnelName}
              onChange={(e) => setNewFunnelName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') createFunnel(); if (e.key === 'Escape') setShowNewFunnelInput(false) }}
              autoFocus
            />
            <button onClick={createFunnel}
              className="p-1.5 rounded-lg text-white"
              style={{ background: 'var(--primary)' }}>
              <Check size={14} />
            </button>
            <button onClick={() => setShowNewFunnelInput(false)}
              className="p-1.5 rounded-lg hover:bg-[rgba(15,23,42,0.06)]">
              <X size={14} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
        ) : (
          <button onClick={() => setShowNewFunnelInput(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border flex-shrink-0 hover:bg-[rgba(15,23,42,0.04)]"
            style={{ color: 'var(--text-muted)', borderColor: 'var(--card-border)' }}>
            <Plus size={13} /> Novo Funil
          </button>
        )}
      </div>

      {/* Kanban */}
      {loadingFunnels ? (
        <div className="flex items-center gap-3 text-sm py-8" style={{ color: 'var(--text-muted)' }}>
          <div className="w-4 h-4 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          Carregando...
        </div>
      ) : funnels.length === 0 ? (
        <div className="card p-14 text-center">
          <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Nenhum funil criado</p>
          <p className="text-sm mt-1.5 mb-5" style={{ color: 'var(--text-muted)' }}>
            Crie seu primeiro funil de vendas para começar a gerenciar leads.
          </p>
          <button onClick={() => setShowNewFunnelInput(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--primary)' }}>
            <Plus size={16} /> Criar Funil
          </button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {visibleStages.map((stage) => {
            const items = grouped.get(stage.id) ?? []
            return (
              <div key={stage.id} className="flex-shrink-0 w-64 flex flex-col gap-3">
                <div className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background: rgba(stage.color, 0.08), border: `1px solid ${rgba(stage.color, 0.2)}` }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
                    <span className="text-[12px] font-bold" style={{ color: stage.color }}>{stage.name}</span>
                    {stage.isWon && <Trophy size={11} style={{ color: stage.color }} />}
                  </div>
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                    style={{ background: stage.color, color: '#fff' }}>
                    {items.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                  {items.length === 0 ? (
                    <div className="rounded-xl px-3 py-6 text-center text-[11px]"
                      style={{ color: 'var(--text-muted)', border: `1px dashed ${rgba(stage.color, 0.25)}` }}>
                      Nenhum lead
                    </div>
                  ) : (
                    items.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} stage={stage} onClick={() => setSelectedLeadId(lead.id)} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals & Panels */}
      {showNewLead && activeFunnel && (
        <NewLeadModal
          funnel={activeFunnel}
          onClose={() => setShowNewLead(false)}
          onCreated={() => { setShowNewLead(false); if (activeFunnelId) loadLeads(activeFunnelId) }}
        />
      )}

      {showEditFunnel && activeFunnel && (
        <EditFunnelPanel
          funnel={activeFunnel}
          onClose={() => setShowEditFunnel(false)}
          onSaved={() => { loadFunnels(); if (activeFunnelId) loadLeads(activeFunnelId) }}
        />
      )}

      {selectedLeadId && activeFunnel && (
        <LeadDetailPanel
          leadId={selectedLeadId}
          funnel={activeFunnel}
          onClose={() => setSelectedLeadId(null)}
          onRefresh={() => { if (activeFunnelId) loadLeads(activeFunnelId); loadFunnels() }}
        />
      )}
    </div>
  )
}
