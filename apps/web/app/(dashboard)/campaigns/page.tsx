'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Megaphone, ArrowRight, Clock, MessageCircle, Reply, CheckCircle2, Plus } from 'lucide-react'
import { api } from '@/lib/api-client'
import type { CampaignSummary } from '@reativa/shared'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:     { label: 'Rascunho',  color: '#64748b',         bg: 'rgba(100,116,139,0.10)' },
  ACTIVE:    { label: 'Ativa',     color: 'var(--success)',  bg: 'var(--success-muted)' },
  PAUSED:    { label: 'Pausada',   color: 'var(--warning)',  bg: 'var(--warning-muted)' },
  COMPLETED: { label: 'Concluída', color: 'var(--info)',     bg: 'var(--info-muted)' },
}

function FunnelPill({ icon: Icon, value, label, color }: { icon: React.ElementType; value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1">
        <Icon size={12} style={{ color }} strokeWidth={2} />
        <span className="text-base font-bold" style={{ color }}>{value}</span>
      </div>
      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<CampaignSummary[]>('/campaigns').then(setCampaigns).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Campanhas</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Gerencie suas campanhas de reativação</p>
        </div>
        <Link href="/campaigns/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
          style={{ background: 'var(--primary)', boxShadow: '0 4px 14px rgba(13,148,136,0.25)' }}>
          <Plus size={16} strokeWidth={2.5} />
          Nova Campanha
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-sm py-8" style={{ color: 'var(--text-muted)' }}>
          <div className="w-4 h-4 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          Carregando...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="card p-14 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--primary-muted)' }}>
              <Megaphone size={26} style={{ color: 'var(--primary)' }} strokeWidth={1.5} />
            </div>
          </div>
          <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Nenhuma campanha ainda</p>
          <p className="text-sm mt-1.5 mb-5" style={{ color: 'var(--text-muted)' }}>
            Sua máquina de lucros está pronta. Vamos trazer pacientes de volta?
          </p>
          <Link href="/campaigns/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--primary)' }}>
            <Plus size={15} strokeWidth={2.5} />
            Criar primeira campanha
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const st = statusConfig[c.status] ?? statusConfig.DRAFT
            return (
              <div key={c.id} className="card p-5 transition-all hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Link href={`/campaigns/${c.id}`}
                        className="font-semibold text-[15px] leading-snug hover:underline"
                        style={{ color: 'var(--text-primary)', textDecorationColor: 'var(--primary)' }}>
                        {c.name}
                      </Link>
                      <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ color: st.color, background: st.bg }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} />
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {c.totalPatients} pacientes · {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-4">
                    <p className="text-base font-bold" style={{ color: 'var(--success)' }}>
                      {(c.estimatedRevenue ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>recuperado</p>
                    <Link href={`/campaigns/${c.id}`}
                      className="flex items-center gap-1 text-[11px] font-medium mt-0.5 hover:underline"
                      style={{ color: 'var(--primary)' }}>
                      Ver pacientes <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1 mt-4 pt-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
                  <FunnelPill icon={Clock}         value={c.pending}    label="Aguardando" color="#94a3b8" />
                  <FunnelPill icon={MessageCircle} value={c.inProgress} label="Em contato"  color="var(--info)" />
                  <FunnelPill icon={Reply}          value={c.responded}  label="Respondeu"  color="var(--warning)" />
                  <FunnelPill icon={CheckCircle2}   value={c.converted}  label="Converteu"  color="var(--success)" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
