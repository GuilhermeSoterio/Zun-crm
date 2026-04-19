'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Filter,
  LayoutGrid,
  List,
  Search,
  Clock,
  MessageCircle,
  Reply,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  ChevronRight,
  SlidersHorizontal,
  X,
  RotateCcw,
  Eye,
  EyeOff,
  Users,
} from 'lucide-react'
import { api } from '@/lib/api-client'
import type { PatientKanbanRow } from '@reativa/shared'

// ─── Types ────────────────────────────────────────────────────────────────────

type KanbanStatus = 'NO_CAMPAIGN' | 'PENDING' | 'IN_PROGRESS' | 'RESPONDED' | 'CONVERTED' | 'OPTED_OUT'

interface PipelineColumn {
  key: KanbanStatus
  label: string
  color: string
  visible: boolean
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PIPELINE: PipelineColumn[] = [
  { key: 'NO_CAMPAIGN', label: 'Sem funil',        color: '#64748b', visible: true },
  { key: 'PENDING',     label: 'Follow Up 1',      color: '#8b5cf6', visible: true },
  { key: 'IN_PROGRESS', label: 'Em Contato',       color: '#0284c7', visible: true },
  { key: 'RESPONDED',   label: 'Respondido',       color: '#d97706', visible: true },
  { key: 'CONVERTED',   label: 'Convertido',       color: '#059669', visible: true },
  { key: 'OPTED_OUT',   label: 'Contato Ignorado', color: '#dc2626', visible: true },
]

const STATUS_ICONS: Record<KanbanStatus, React.ElementType> = {
  NO_CAMPAIGN: Users,
  PENDING:     Clock,
  IN_PROGRESS: MessageCircle,
  RESPONDED:   Reply,
  CONVERTED:   CheckCircle2,
  OPTED_OUT:   XCircle,
}

const COLOR_PALETTE = [
  '#64748b', '#8b5cf6', '#6366f1', '#0284c7', '#0891b2',
  '#059669', '#65a30d', '#d97706', '#ea580c', '#dc2626', '#db2777',
]

const STORAGE_KEY = 'reativa_pipeline_columns'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveStatus(p: PatientKanbanRow): KanbanStatus {
  if (!p.campaignStatus) return 'NO_CAMPAIGN'
  if (p.campaignStatus === 'FAILED') return 'IN_PROGRESS'
  return p.campaignStatus as KanbanStatus
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, '')
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  return phone
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function rgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ─── Patient Card ─────────────────────────────────────────────────────────────

function PatientCard({ patient, col }: { patient: PatientKanbanRow; col: PipelineColumn }) {
  const Icon = STATUS_ICONS[col.key]
  return (
    <div
      className="card p-4 flex flex-col gap-3 hover:shadow-md transition-all cursor-default"
      style={{ borderLeft: `3px solid ${col.color}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-[13px] leading-tight" style={{ color: 'var(--text-primary)' }}>
          {patient.name}
        </p>
        <span
          className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
          style={{ color: col.color, background: rgba(col.color, 0.1) }}
        >
          <Icon size={10} strokeWidth={2.5} />
          {patient.currentStep > 0 ? `Etapa ${patient.currentStep}` : col.label}
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {formatPhone(patient.phone)}
        </p>
        {patient.lastProcedure && (
          <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            {patient.lastProcedure}
          </p>
        )}
        {patient.inactiveDays != null && (
          <div className="flex items-center gap-1">
            <AlertCircle size={10} style={{ color: 'var(--warning)' }} />
            <span className="text-[10px]" style={{ color: 'var(--warning)' }}>
              {patient.inactiveDays} dias inativo
            </span>
          </div>
        )}
        {patient.lastAppointmentDate && (
          <div className="flex items-center gap-1">
            <Calendar size={10} style={{ color: 'var(--text-muted)' }} />
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Última consulta: {formatDate(patient.lastAppointmentDate)}
            </span>
          </div>
        )}
      </div>

      {patient.campaignId && (
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <p className="text-[10px] truncate max-w-[130px]" style={{ color: 'var(--text-muted)' }}>
            {patient.campaignName}
          </p>
          <Link
            href={`/campaigns/${patient.campaignId}`}
            className="flex items-center gap-0.5 text-[10px] font-medium hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            Ver <ChevronRight size={10} />
          </Link>
        </div>
      )}

      {patient.actualValue != null && (
        <p className="text-[11px] font-bold" style={{ color: 'var(--success)' }}>
          {patient.actualValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
      )}
    </div>
  )
}

// ─── List Row ─────────────────────────────────────────────────────────────────

function PatientListRow({ patient, pipeline }: { patient: PatientKanbanRow; pipeline: PipelineColumn[] }) {
  const status = resolveStatus(patient)
  const col = pipeline.find((c) => c.key === status) ?? pipeline[0]
  const Icon = STATUS_ICONS[col.key]
  return (
    <tr className="border-b transition-colors hover:bg-[rgba(15,23,42,0.02)]" style={{ borderColor: 'var(--card-border)' }}>
      <td className="px-4 py-3">
        <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{patient.name}</p>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{formatPhone(patient.phone)}</p>
      </td>
      <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
        {patient.lastProcedure ?? '—'}
      </td>
      <td className="px-4 py-3">
        {patient.inactiveDays != null ? (
          <span className="text-[12px]" style={{ color: patient.inactiveDays > 180 ? 'var(--danger)' : 'var(--warning)' }}>
            {patient.inactiveDays}d
          </span>
        ) : '—'}
      </td>
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold"
          style={{ color: col.color, background: rgba(col.color, 0.1) }}
        >
          <Icon size={10} strokeWidth={2.5} />
          {col.label}
          {patient.currentStep > 0 && ` · E${patient.currentStep}`}
        </span>
      </td>
      <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
        {patient.campaignId ? (
          <Link href={`/campaigns/${patient.campaignId}`}
            className="hover:underline truncate max-w-[160px] block"
            style={{ color: 'var(--primary)' }}>
            {patient.campaignName}
          </Link>
        ) : '—'}
      </td>
      <td className="px-4 py-3 text-[12px] font-semibold">
        {patient.actualValue != null
          ? <span style={{ color: 'var(--success)' }}>{patient.actualValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          : patient.estimatedValue != null
          ? <span style={{ color: 'var(--text-muted)' }}>~{patient.estimatedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          : '—'}
      </td>
    </tr>
  )
}

// ─── Edit Pipeline Panel ──────────────────────────────────────────────────────

interface EditPanelProps {
  draft: PipelineColumn[]
  onChange: (cols: PipelineColumn[]) => void
  onSave: () => void
  onReset: () => void
  onClose: () => void
}

function EditPipelinePanel({ draft, onChange, onSave, onReset, onClose }: EditPanelProps) {
  function updateLabel(key: KanbanStatus, label: string) {
    onChange(draft.map((c) => (c.key === key ? { ...c, label } : c)))
  }
  function updateColor(key: KanbanStatus, color: string) {
    onChange(draft.map((c) => (c.key === key ? { ...c, color } : c)))
  }
  function toggleVisible(key: KanbanStatus) {
    onChange(draft.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)))
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.3)' }}
        onClick={onClose}
      />
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: '360px',
          background: 'var(--card)',
          borderLeft: '1px solid var(--card-border)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <div>
            <h3 className="font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>
              Editar Pipeline
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Personalize as etapas do funil
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(15,23,42,0.06)]"
          >
            <X size={16} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Column list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {draft.map((col) => {
            const Icon = STATUS_ICONS[col.key]
            return (
              <div
                key={col.key}
                className="p-3 rounded-xl border space-y-3 transition-opacity"
                style={{
                  borderColor: col.visible ? col.color + '40' : 'var(--card-border)',
                  background: col.visible ? rgba(col.color, 0.04) : 'rgba(15,23,42,0.02)',
                  opacity: col.visible ? 1 : 0.5,
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: rgba(col.color, 0.12) }}
                  >
                    <Icon size={13} strokeWidth={2.5} style={{ color: col.color }} />
                  </div>
                  <input
                    className="flex-1 text-[13px] font-medium px-2 py-1 rounded-lg border outline-none focus:ring-1"
                    style={{
                      color: 'var(--text-primary)',
                      background: 'var(--background)',
                      borderColor: 'var(--card-border)',
                    }}
                    value={col.label}
                    onChange={(e) => updateLabel(col.key, e.target.value)}
                    placeholder="Nome da etapa"
                  />
                  <button
                    onClick={() => toggleVisible(col.key)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(15,23,42,0.06)] flex-shrink-0"
                    title={col.visible ? 'Ocultar coluna' : 'Mostrar coluna'}
                  >
                    {col.visible
                      ? <Eye size={14} style={{ color: 'var(--text-muted)' }} />
                      : <EyeOff size={14} style={{ color: 'var(--text-muted)' }} />}
                  </button>
                </div>

                {/* Color palette */}
                <div className="flex items-center gap-1.5 flex-wrap pl-9">
                  {COLOR_PALETTE.map((hex) => (
                    <button
                      key={hex}
                      onClick={() => updateColor(col.key, hex)}
                      className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                      style={{
                        background: hex,
                        outline: col.color === hex ? `2px solid ${hex}` : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-2" style={{ borderColor: 'var(--card-border)' }}>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border transition-colors hover:bg-[rgba(15,23,42,0.04)]"
            style={{ color: 'var(--text-muted)', borderColor: 'var(--card-border)' }}
          >
            <RotateCcw size={12} />
            Restaurar padrão
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-2 rounded-lg text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--primary)' }}
          >
            Salvar Pipeline
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FunisPage() {
  const [patients, setPatients] = useState<PatientKanbanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [search, setSearch] = useState('')
  const [pipeline, setPipeline] = useState<PipelineColumn[]>(DEFAULT_PIPELINE)
  const [editOpen, setEditOpen] = useState(false)
  const [editDraft, setEditDraft] = useState<PipelineColumn[]>(DEFAULT_PIPELINE)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: PipelineColumn[] = JSON.parse(stored)
        const merged = DEFAULT_PIPELINE.map((def) => parsed.find((c) => c.key === def.key) ?? def)
        setPipeline(merged)
      }
    } catch {}
  }, [])

  useEffect(() => {
    api.get<PatientKanbanRow[]>('/patients')
      .then(setPatients)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function openEdit() {
    setEditDraft(pipeline.map((c) => ({ ...c })))
    setEditOpen(true)
  }

  function savePipeline() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(editDraft))
    setPipeline(editDraft)
    setEditOpen(false)
  }

  const visibleColumns = useMemo(() => pipeline.filter((c) => c.visible), [pipeline])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return patients
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.lastProcedure?.toLowerCase().includes(q) ||
        p.campaignName?.toLowerCase().includes(q),
    )
  }, [patients, search])

  const grouped = useMemo(() => {
    const map = new Map<KanbanStatus, PatientKanbanRow[]>()
    pipeline.forEach((c) => map.set(c.key, []))
    filtered.forEach((p) => {
      const key = resolveStatus(p)
      map.get(key)?.push(p)
    })
    return map
  }, [filtered, pipeline])

  const totalByStatus = useMemo(() => {
    const map = new Map<KanbanStatus, number>()
    pipeline.forEach((c) => map.set(c.key, 0))
    patients.forEach((p) => {
      const key = resolveStatus(p)
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return map
  }, [patients, pipeline])

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Funis
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {patients.length} pacientes · cadência de reativação
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openEdit}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors hover:bg-[rgba(15,23,42,0.04)]"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--card-border)', background: 'var(--card)' }}
          >
            <SlidersHorizontal size={13} strokeWidth={2} />
            Editar Pipeline
          </button>

          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
            <button
              onClick={() => setView('kanban')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={view === 'kanban' ? { background: 'var(--primary)', color: '#fff' } : { color: 'var(--text-muted)' }}
            >
              <LayoutGrid size={13} strokeWidth={2} />
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={view === 'list' ? { background: 'var(--primary)', color: '#fff' } : { color: 'var(--text-muted)' }}
            >
              <List size={13} strokeWidth={2} />
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          className="input-base pl-8 text-sm"
          placeholder="Buscar por nome, telefone ou procedimento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Status pills */}
      <div className="flex gap-2 flex-wrap">
        {visibleColumns.map((col) => {
          const count = totalByStatus.get(col.key) ?? 0
          if (count === 0) return null
          const Icon = STATUS_ICONS[col.key]
          return (
            <div
              key={col.key}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: rgba(col.color, 0.1), color: col.color }}
            >
              <Icon size={11} strokeWidth={2.5} />
              {col.label}: {count}
            </div>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-sm py-8" style={{ color: 'var(--text-muted)' }}>
          <div className="w-4 h-4 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          Carregando funil...
        </div>
      ) : patients.length === 0 ? (
        <div className="card p-14 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--primary-muted)' }}>
              <Filter size={26} style={{ color: 'var(--primary)' }} strokeWidth={1.5} />
            </div>
          </div>
          <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Nenhum paciente no funil</p>
          <p className="text-sm mt-1.5 mb-5" style={{ color: 'var(--text-muted)' }}>
            Importe sua base de pacientes para começar a cadência.
          </p>
          <Link href="/import"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--primary)' }}>
            Importar pacientes
          </Link>
        </div>
      ) : view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {visibleColumns.map((col) => {
            const items = grouped.get(col.key) ?? []
            const Icon = STATUS_ICONS[col.key]
            return (
              <div key={col.key} className="flex-shrink-0 w-64 flex flex-col gap-3">
                <div
                  className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background: rgba(col.color, 0.08), border: `1px solid ${rgba(col.color, 0.2)}` }}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={13} strokeWidth={2.5} style={{ color: col.color }} />
                    <span className="text-[12px] font-bold" style={{ color: col.color }}>
                      {col.label}
                    </span>
                  </div>
                  <span
                    className="text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                    style={{ background: col.color, color: '#fff' }}
                  >
                    {items.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                  {items.length === 0 ? (
                    <div
                      className="rounded-xl px-3 py-6 text-center text-[11px]"
                      style={{ color: 'var(--text-muted)', border: `1px dashed ${rgba(col.color, 0.25)}` }}
                    >
                      Nenhum paciente
                    </div>
                  ) : (
                    items.map((p) => <PatientCard key={p.id} patient={p} col={col} />)
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                {['Paciente', 'Procedimento', 'Inativo', 'Status', 'Campanha', 'Valor'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    Nenhum resultado para &quot;{search}&quot;
                  </td>
                </tr>
              ) : (
                filtered.map((p) => <PatientListRow key={p.id} patient={p} pipeline={pipeline} />)
              )}
            </tbody>
          </table>
        </div>
      )}

      {editOpen && (
        <EditPipelinePanel
          draft={editDraft}
          onChange={setEditDraft}
          onSave={savePipeline}
          onReset={() => setEditDraft(DEFAULT_PIPELINE.map((c) => ({ ...c })))}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  )
}
