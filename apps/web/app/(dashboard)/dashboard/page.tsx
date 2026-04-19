'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import type { DashboardData } from '@reativa/shared'
import { TrendingUp, Users, Zap, CheckCircle2 } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'

function MetricCard({ label, value, icon: Icon, iconBg, iconColor, valueColor, large }: {
  label: string; value: string; icon: React.ElementType
  iconBg: string; iconColor: string; valueColor: string; large?: boolean
}) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
          <Icon size={15} style={{ color: iconColor }} strokeWidth={2.5} />
        </div>
      </div>
      <p className={`font-bold leading-none tracking-tight ${large ? 'text-3xl' : 'text-2xl'}`}
        style={{ color: valueColor }}>
        {value}
      </p>
    </div>
  )
}

function StatusPill({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: color }} />
        <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value.toLocaleString('pt-BR')}</span>
      </div>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}

const TOOLTIP_STYLE = {
  background: '#FFFFFF',
  border: '1px solid rgba(15,23,42,0.08)',
  borderRadius: 10,
  fontSize: 12,
  color: '#0f172a',
  boxShadow: '0 4px 16px rgba(15,23,42,0.10)',
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<DashboardData>('/dashboard').then(setData).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
          <div className="w-4 h-4 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          Carregando dashboard...
        </div>
      </div>
    )
  }

  if (!data) return <div className="text-sm" style={{ color: 'var(--danger)' }}>Erro ao carregar dados.</div>

  const funnelSteps = [
    { label: 'Aguardando',  value: data.funnel.pending,    color: '#94a3b8' },
    { label: 'Em contato',  value: data.funnel.inProgress, color: 'var(--info)' },
    { label: 'Respondeu',   value: data.funnel.responded,  color: 'var(--warning)' },
    { label: 'Converteu',   value: data.funnel.converted,  color: 'var(--success)' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Dashboard</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Visão geral das suas campanhas de reativação</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Faturamento Recuperado"
          value={data.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          icon={TrendingUp} iconBg="var(--success-muted)" iconColor="var(--success)" valueColor="var(--success)" large />
        <MetricCard label="Total de Pacientes"
          value={data.totalPatients.toLocaleString('pt-BR')}
          icon={Users} iconBg="var(--info-muted)" iconColor="var(--info)" valueColor="var(--info)" />
        <MetricCard label="Campanhas Ativas"
          value={data.activeCampaigns.toLocaleString('pt-BR')}
          icon={Zap} iconBg="var(--warning-muted)" iconColor="var(--warning)" valueColor="var(--warning)" />
        <MetricCard label="Convertidos"
          value={data.funnel.converted.toLocaleString('pt-BR')}
          icon={CheckCircle2} iconBg="var(--success-muted)" iconColor="var(--success)" valueColor="var(--success)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-5" style={{ color: 'var(--text-secondary)' }}>Funil de Reativação</h3>
          <div className="grid grid-cols-4 gap-2 mb-5">
            {funnelSteps.map((s) => (
              <StatusPill key={s.label} color={s.color} label={s.label} value={s.value} />
            ))}
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={funnelSteps} layout="vertical" margin={{ left: 0, right: 8 }}>
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} width={72} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(15,23,42,0.03)' }} contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" radius={6} maxBarSize={24}>
                {funnelSteps.map((step, i) => <Cell key={i} fill={step.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-5" style={{ color: 'var(--text-secondary)' }}>Disparos — últimos 30 dias</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.timeline} margin={{ left: -16, right: 8 }}>
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ stroke: 'rgba(15,23,42,0.06)' }} contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2}
                dot={false} activeDot={{ r: 4, fill: 'var(--primary)', strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {data.totalPatients > 0 && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Intenção das respostas — IA</h3>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { key: 'interested',    label: 'Interessado',  color: 'var(--success)', bg: 'var(--success-muted)' },
              { key: 'question',      label: 'Pergunta',     color: 'var(--info)',    bg: 'var(--info-muted)' },
              { key: 'reschedule',    label: 'Remarcar',     color: 'var(--warning)', bg: 'var(--warning-muted)' },
              { key: 'not_interested',label: 'Sem interesse',color: 'var(--danger)',  bg: 'var(--danger-muted)' },
              { key: 'opt_out',       label: 'Opt-out',      color: '#64748b',        bg: 'rgba(100,116,139,0.10)' },
              { key: 'other',         label: 'Outros',       color: '#94a3b8',        bg: 'rgba(148,163,184,0.10)' },
            ].map(({ key, label, color, bg }) => (
              <div key={key} className="rounded-xl p-3 text-center" style={{ background: bg }}>
                <p className="text-2xl font-bold leading-none" style={{ color }}>
                  {data.aiBreakdown[key as keyof typeof data.aiBreakdown]}
                </p>
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.totalPatients === 0 && (
        <div className="card p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--primary-muted)' }}>
              <TrendingUp size={28} style={{ color: 'var(--primary)' }} strokeWidth={1.5} />
            </div>
          </div>
          <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Sua máquina de faturamento está pronta</p>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>Importe pacientes e crie sua primeira campanha para começar.</p>
        </div>
      )}
    </div>
  )
}
