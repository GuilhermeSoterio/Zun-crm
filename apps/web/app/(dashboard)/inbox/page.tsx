'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import {
  MessageCircle,
  Send,
  Zap,
  Plus,
  X,
  Search,
  Clock,
  CheckCheck,
  Check,
  Bot,
  Phone,
  ChevronRight,
  Settings2,
  Trash2,
} from 'lucide-react'
import { api } from '@/lib/api-client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  patientId: string
  name: string
  phone: string
  lastMessage: {
    body: string
    direction: 'OUTBOUND' | 'INBOUND'
    createdAt: string
    aiClassification: string | null
  } | null
  unreadCount: number
  campaignName: string | null
  updatedAt: string
}

interface Message {
  id: string
  type: 'campaign' | 'direct'
  direction: 'OUTBOUND' | 'INBOUND'
  body: string
  status: string
  aiClassification: string | null
  aiConfidence: number | null
  campaignName: string | null
  stepNumber: number | null
  createdAt: string
}

interface ConversationDetail {
  patient: {
    id: string
    name: string
    phone: string
    lastProcedure: string | null
    inactiveDays: number | null
    optedOut: boolean
  }
  messages: Message[]
}

interface QuickReply {
  id: string
  title: string
  body: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AI_LABELS: Record<string, { label: string; color: string }> = {
  interested:     { label: 'Interessado',    color: '#059669' },
  reschedule:     { label: 'Reagendar',      color: '#d97706' },
  question:       { label: 'Dúvida',         color: '#0284c7' },
  not_interested: { label: 'Não interesse',  color: '#64748b' },
  opt_out:        { label: 'Opt-out',        color: '#dc2626' },
  other:          { label: 'Outro',          color: '#94a3b8' },
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return d.toLocaleDateString('pt-BR', { weekday: 'short' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, '')
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  return phone
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'READ') return <CheckCheck size={12} style={{ color: '#0284c7' }} />
  if (status === 'DELIVERED') return <CheckCheck size={12} style={{ color: '#94a3b8' }} />
  if (status === 'SENT') return <Check size={12} style={{ color: '#94a3b8' }} />
  return null
}

// ─── Quick Replies Panel ──────────────────────────────────────────────────────

function QuickRepliesPanel({ onSelect, onClose }: { onSelect: (body: string) => void; onClose: () => void }) {
  const [replies, setReplies] = useState<QuickReply[]>([])
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => { api.get<QuickReply[]>('/quick-replies').then(setReplies) }, [])

  async function create() {
    if (!newTitle.trim() || !newBody.trim()) return
    const qr = await api.post<QuickReply>('/quick-replies', { title: newTitle, body: newBody })
    setReplies([...replies, qr])
    setNewTitle('')
    setNewBody('')
    setShowNew(false)
  }

  async function remove(id: string) {
    await api.delete(`/quick-replies/${id}`)
    setReplies(replies.filter((r) => r.id !== id))
  }

  const filtered = replies.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.body.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="absolute bottom-full mb-2 left-0 right-0 rounded-2xl border shadow-xl z-20 flex flex-col overflow-hidden"
      style={{ background: 'var(--card)', borderColor: 'var(--card-border)', maxHeight: '320px' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
        <div className="flex items-center gap-2">
          <Zap size={14} style={{ color: 'var(--primary)' }} />
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Respostas Rápidas</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setShowNew(!showNew)}
            className="p-1.5 rounded-lg hover:bg-[rgba(15,23,42,0.06)]">
            <Plus size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgba(15,23,42,0.06)]">
            <X size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      </div>

      {showNew && (
        <div className="px-4 py-3 border-b space-y-2" style={{ borderColor: 'var(--card-border)' }}>
          <input className="input-base text-sm w-full" placeholder="Título (ex: Confirmação de consulta)"
            value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <textarea className="input-base text-sm w-full resize-none" rows={2} placeholder="Mensagem..."
            value={newBody} onChange={(e) => setNewBody(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={() => setShowNew(false)}
              className="flex-1 py-1.5 rounded-lg text-[12px] border"
              style={{ color: 'var(--text-muted)', borderColor: 'var(--card-border)' }}>
              Cancelar
            </button>
            <button onClick={create}
              className="flex-1 py-1.5 rounded-lg text-[12px] font-semibold text-white"
              style={{ background: 'var(--primary)' }}>
              Salvar
            </button>
          </div>
        </div>
      )}

      {replies.length > 3 && (
        <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input className="input-base text-[12px] pl-7 py-1.5 w-full" placeholder="Buscar resposta..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      )}

      <div className="overflow-y-auto flex-1">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>
            {replies.length === 0 ? 'Nenhuma resposta rápida salva.' : 'Sem resultados.'}
          </p>
        ) : filtered.map((r) => (
          <div key={r.id} className="group flex items-start gap-2 px-4 py-3 hover:bg-[rgba(15,23,42,0.03)] transition-colors cursor-pointer border-b last:border-0"
            style={{ borderColor: 'var(--card-border)' }} onClick={() => onSelect(r.body)}>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
              <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.body}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); remove(r.id) }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[rgba(220,38,38,0.1)] transition-all">
              <Trash2 size={12} style={{ color: '#dc2626' }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ConversationDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [search, setSearch] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadConversations = useCallback(async () => {
    try {
      const data = await api.get<Conversation[]>('/inbox')
      setConversations(data)
    } finally {
      setLoadingConvs(false)
    }
  }, [])

  useEffect(() => { loadConversations() }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoadingDetail(true)
    setDetail(null)
    api.get<ConversationDetail>(`/inbox/${selectedId}`)
      .then(setDetail)
      .finally(() => setLoadingDetail(false))
  }, [selectedId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [detail?.messages])

  async function send() {
    if (!message.trim() || !selectedId || sending) return
    setSending(true)
    const body = message.trim()
    setMessage('')
    try {
      await api.post(`/inbox/${selectedId}/send`, { body })
      const updated = await api.get<ConversationDetail>(`/inbox/${selectedId}`)
      setDetail(updated)
      loadConversations()
    } finally {
      setSending(false)
    }
  }

  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  const selectedConv = conversations.find((c) => c.patientId === selectedId)

  return (
    <div className="flex gap-0 -m-8 overflow-hidden" style={{ height: 'calc(100vh - 0px)', minHeight: '600px' }}>

      {/* ── Conversation List ── */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r" style={{ borderColor: 'var(--card-border)', background: 'var(--card)' }}>
        <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <h2 className="font-bold text-[16px] mb-3" style={{ color: 'var(--text-primary)' }}>Inbox</h2>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input className="input-base pl-8 text-sm w-full" placeholder="Buscar conversa..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 rounded-full border-2 animate-spin"
                style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <MessageCircle size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} strokeWidth={1.5} />
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                {search ? 'Sem resultados' : 'Nenhuma conversa ainda'}
              </p>
            </div>
          ) : filtered.map((c) => {
            const active = c.patientId === selectedId
            const ai = c.lastMessage?.aiClassification ? AI_LABELS[c.lastMessage.aiClassification] : null
            return (
              <button key={c.patientId} onClick={() => setSelectedId(c.patientId)}
                className="w-full px-4 py-3 flex items-start gap-3 transition-colors border-b text-left"
                style={{
                  borderColor: 'var(--card-border)',
                  background: active ? 'var(--primary-muted)' : 'transparent',
                }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                  style={{ background: active ? 'var(--primary)' : '#94a3b8' }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[13px] font-semibold truncate" style={{ color: active ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {c.name}
                    </p>
                    <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {c.lastMessage ? formatTime(c.lastMessage.createdAt) : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {c.lastMessage?.direction === 'OUTBOUND' && <ChevronRight size={10} style={{ color: 'var(--text-muted)' }} />}
                    <p className="text-[11px] truncate flex-1" style={{ color: 'var(--text-muted)' }}>
                      {c.lastMessage?.body ?? 'Sem mensagens'}
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: 'var(--primary)' }}>
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  {ai && (
                    <span className="inline-flex mt-1 text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: ai.color + '20', color: ai.color }}>
                      {ai.label}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Chat Panel ── */}
      {!selectedId ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-3"
          style={{ background: 'var(--background)' }}>
          <MessageCircle size={48} style={{ color: 'var(--text-muted)' }} strokeWidth={1.5} />
          <p className="text-[15px] font-medium" style={{ color: 'var(--text-muted)' }}>
            Selecione uma conversa
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col" style={{ background: 'var(--background)' }}>
          {/* Chat Header */}
          <div className="px-5 py-3.5 border-b flex items-center gap-3"
            style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
              style={{ background: 'var(--primary)' }}>
              {selectedConv?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[14px]" style={{ color: 'var(--text-primary)' }}>
                {selectedConv?.name}
              </p>
              <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Phone size={10} />
                {selectedConv?.phone ? formatPhone(selectedConv.phone) : ''}
                {selectedConv?.campaignName && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                    style={{ background: 'var(--primary-muted)', color: 'var(--primary)' }}>
                    {selectedConv.campaignName}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {loadingDetail ? (
              <div className="flex justify-center py-12">
                <div className="w-5 h-5 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
              </div>
            ) : detail?.messages.map((msg) => {
              const isOut = msg.direction === 'OUTBOUND'
              const ai = msg.aiClassification ? AI_LABELS[msg.aiClassification] : null
              return (
                <div key={msg.id} className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[70%] flex flex-col gap-1">
                    {msg.campaignName && !isOut && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded self-start"
                        style={{ background: 'var(--primary-muted)', color: 'var(--primary)' }}>
                        Campanha: {msg.campaignName} · E{msg.stepNumber}
                      </span>
                    )}
                    <div className="px-3 py-2 rounded-2xl text-[13px] leading-relaxed"
                      style={{
                        background: isOut ? 'var(--primary)' : 'var(--card)',
                        color: isOut ? '#fff' : 'var(--text-primary)',
                        borderBottomRightRadius: isOut ? '4px' : '16px',
                        borderBottomLeftRadius: isOut ? '16px' : '4px',
                        border: isOut ? 'none' : '1px solid var(--card-border)',
                      }}>
                      {msg.body}
                    </div>
                    <div className={`flex items-center gap-1 ${isOut ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {formatTime(msg.createdAt)}
                      </span>
                      {isOut && <StatusIcon status={msg.status} />}
                      {ai && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5"
                          style={{ background: ai.color + '20', color: ai.color }}>
                          <Bot size={9} /> {ai.label}
                          {msg.aiConfidence && ` ${Math.round(msg.aiConfidence * 100)}%`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {detail?.patient.optedOut ? (
            <div className="px-5 py-4 border-t text-center text-[13px]"
              style={{ borderColor: 'var(--card-border)', background: 'var(--card)', color: 'var(--danger)' }}>
              Paciente optou por não receber mensagens (opt-out)
            </div>
          ) : (
            <div className="px-4 py-3 border-t relative" style={{ borderColor: 'var(--card-border)', background: 'var(--card)' }}>
              {showQuickReplies && (
                <QuickRepliesPanel
                  onSelect={(body) => { setMessage(body); setShowQuickReplies(false) }}
                  onClose={() => setShowQuickReplies(false)}
                />
              )}
              <div className="flex items-end gap-2">
                <button onClick={() => setShowQuickReplies(!showQuickReplies)}
                  className="p-2 rounded-xl transition-colors flex-shrink-0"
                  style={{
                    background: showQuickReplies ? 'var(--primary-muted)' : 'transparent',
                    color: showQuickReplies ? 'var(--primary)' : 'var(--text-muted)',
                  }}
                  title="Respostas rápidas">
                  <Zap size={18} />
                </button>
                <textarea
                  className="flex-1 input-base text-sm resize-none"
                  rows={1}
                  placeholder="Digite uma mensagem..."
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
                  }}
                  style={{ minHeight: '40px', maxHeight: '120px' }}
                />
                <button onClick={send} disabled={!message.trim() || sending}
                  className="p-2.5 rounded-xl text-white flex-shrink-0 transition-opacity"
                  style={{ background: 'var(--primary)', opacity: (!message.trim() || sending) ? 0.5 : 1 }}>
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
