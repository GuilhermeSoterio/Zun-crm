'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Activity } from 'lucide-react'
import { api, setToken } from '@/lib/api-client'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post<{ token: string; clinic: { name: string } }>(
        '/auth/register', form
      )
      setToken(res.token)
      localStorage.setItem('reativa_clinic', JSON.stringify(res.clinic))
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--primary)' }}>
            <Activity size={24} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Reativa</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Crie sua conta gratuita</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card p-7 space-y-4">
          {error && (
            <div className="rounded-xl p-3 text-sm"
              style={{ background: 'var(--danger-muted)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.15)' }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nome da clínica</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              required placeholder="Clínica Exemplo" className="input-base" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              required placeholder="contato@clinica.com" className="input-base" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Senha</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8} required placeholder="Mínimo 8 caracteres" className="input-base" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Criando conta...' : 'Criar conta grátis'}
          </button>

          <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Já tem conta?{' '}
            <Link href="/login" style={{ color: 'var(--primary)' }} className="font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
