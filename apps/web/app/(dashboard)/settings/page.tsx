'use client'

import { useState, useEffect } from 'react'
import { Smartphone, DollarSign, Tag, Shield, Plus, X, Loader2 } from 'lucide-react'
import { api } from '@/lib/api-client'
import type { ProcedurePrice } from '@reativa/shared'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const sectionClass = 'card p-6 space-y-4'
const labelClass = 'block text-sm font-medium text-slate-300 mb-1.5'
const inputClass = 'input-base'

export default function SettingsPage() {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [avgTicket, setAvgTicket] = useState('')

  // Preços por procedimento
  const [prices, setPrices] = useState<ProcedurePrice[]>([])
  const [newProcedure, setNewProcedure] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [savingPrice, setSavingPrice] = useState(false)

  useEffect(() => {
    api.get<ProcedurePrice[]>('/procedure-prices').then(setPrices).catch(console.error)
  }, [])

  async function handleConnectWhatsApp() {
    setConnecting(true)
    try {
      const token = localStorage.getItem('reativa_token')
      const res = await fetch(`${API_URL}/clinics/whatsapp/connect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        setQrCode(data.qrCode)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setConnecting(false)
    }
  }

  async function handleAddPrice() {
    if (!newProcedure || !newPrice) return
    setSavingPrice(true)
    try {
      const created = await api.post<ProcedurePrice>('/procedure-prices', {
        procedureName: newProcedure.trim(),
        price: Number(newPrice),
      })
      setPrices((prev) => {
        const idx = prev.findIndex((p) => p.procedureName === created.procedureName)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = created
          return updated
        }
        return [...prev, created].sort((a, b) => a.procedureName.localeCompare(b.procedureName))
      })
      setNewProcedure('')
      setNewPrice('')
    } catch (err) {
      console.error(err)
    } finally {
      setSavingPrice(false)
    }
  }

  async function handleDeletePrice(id: string) {
    await api.delete(`/procedure-prices/${id}`)
    setPrices((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Configurações</h2>
        <p className="text-slate-500 text-sm mt-1">Gerencie sua clínica e integrações</p>
      </div>

      {/* WhatsApp */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--success-muted)' }}>
              <Smartphone size={16} style={{ color: 'var(--success)' }} strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-sm">WhatsApp</h3>
              <p className="text-xs text-slate-500 mt-0.5">Conecte seu número para enviar mensagens</p>
            </div>
          </div>
          <span
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={
              connected
                ? { color: 'var(--success)', background: 'var(--success-muted)' }
                : { color: '#475569', background: 'rgba(71,85,105,0.15)' }
            }
          >
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'pulse-dot' : ''}`}
              style={{ background: connected ? 'var(--success)' : '#475569' }} />
            {connected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>

        {!connected && !qrCode && (
          <button
            onClick={handleConnectWhatsApp}
            disabled={connecting}
            className="btn-primary flex items-center gap-2"
          >
            {connecting ? <Loader2 size={15} className="animate-spin" /> : <Smartphone size={15} />}
            {connecting ? 'Gerando QR Code...' : 'Conectar WhatsApp'}
          </button>
        )}

        {qrCode && (
          <div className="text-center space-y-3">
            <p className="text-sm text-slate-300">Escaneie o QR Code com seu WhatsApp</p>
            <img src={qrCode} alt="QR Code WhatsApp" className="mx-auto rounded-xl" style={{ maxWidth: 200 }} />
            <p className="text-xs text-slate-500">WhatsApp → Aparelhos conectados → Conectar aparelho</p>
          </div>
        )}
      </div>

      {/* Ticket médio */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-muted)' }}>
            <DollarSign size={16} style={{ color: 'var(--primary)' }} strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-200 text-sm">Ticket médio padrão</h3>
            <p className="text-xs text-slate-500 mt-0.5">Fallback quando o procedimento não tiver preço cadastrado</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">R$</span>
            <input
              type="number"
              value={avgTicket}
              onChange={(e) => setAvgTicket(e.target.value)}
              placeholder="250"
              className="input-base pl-9"
            />
          </div>
          <button className="btn-primary px-5">Salvar</button>
        </div>
      </div>

      {/* Preços por procedimento */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--info-muted)' }}>
            <Tag size={16} style={{ color: 'var(--info)' }} strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-200 text-sm">Preços por Procedimento</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Usado automaticamente como estimativa ao criar campanhas
            </p>
          </div>
        </div>

        {prices.length > 0 && (
          <div className="space-y-1.5">
            {prices.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl px-3.5 py-2.5 border transition-colors"
                style={{ borderColor: 'var(--card-border)', background: 'rgba(255,255,255,0.02)' }}
              >
                <span className="text-sm text-slate-300 font-medium">{p.procedureName}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
                    {Number(p.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <button
                    onClick={() => handleDeletePrice(p.id)}
                    className="text-slate-600 hover:text-slate-400 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newProcedure}
            onChange={(e) => setNewProcedure(e.target.value)}
            placeholder="Ex: Botox, Limpeza, Consulta"
            className="input-base flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddPrice()}
          />
          <div className="relative w-28">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">R$</span>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="0"
              className="input-base pl-8"
              onKeyDown={(e) => e.key === 'Enter' && handleAddPrice()}
            />
          </div>
          <button
            onClick={handleAddPrice}
            disabled={!newProcedure || !newPrice || savingPrice}
            className="flex items-center gap-1.5 btn-primary px-4"
          >
            {savingPrice ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} strokeWidth={2.5} />}
            Add
          </button>
        </div>
      </div>

      {/* LGPD */}
      <div className={sectionClass} style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--success-muted)' }}>
            <Shield size={16} style={{ color: 'var(--success)' }} strokeWidth={2} />
          </div>
          <h3 className="font-semibold text-slate-200 text-sm">LGPD & Privacidade</h3>
        </div>
        <ul className="space-y-2">
          {[
            'Dados de pacientes criptografados (AES-256)',
            'Opt-out automático via resposta "SAIR"',
            'Isolamento total de dados entre clínicas',
            'Exclusão automática após 30 dias do opt-out',
          ].map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-sm text-slate-400">
              <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--success-muted)' }}>
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3.5L3.5 6L8 1" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
