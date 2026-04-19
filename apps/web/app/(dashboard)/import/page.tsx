'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import { UploadCloud, FileSpreadsheet, X, CheckCircle2, Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const REQUIRED_FIELDS = ['name', 'phone'] as const
const OPTIONAL_FIELDS = ['lastAppointmentDate', 'lastProcedure'] as const

const FIELD_LABELS: Record<string, string> = {
  name: 'Nome do paciente',
  phone: 'Telefone / WhatsApp',
  lastAppointmentDate: 'Data da última consulta',
  lastProcedure: 'Último procedimento',
}

const inputClass = 'input-base'
const labelClass = 'text-sm font-medium text-slate-300'

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [columns, setColumns] = useState<string[]>([])
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)
  const [importJobId, setImportJobId] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ processed: number; total: number | null } | null>(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0]
    if (!f) return
    setFile(f)
    setError('')

    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { raw: false })

      if (rows.length === 0) { setError('Planilha vazia'); return }

      const cols = Object.keys(rows[0])
      setColumns(cols)
      setPreview(rows.slice(0, 5))
      setMapping({})
    }
    reader.readAsArrayBuffer(f)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  })

  async function handleImport() {
    if (!file || !mapping.name || !mapping.phone) {
      setError('Mapeie os campos obrigatórios: Nome e Telefone')
      return
    }
    setImporting(true)
    setError('')

    try {
      const token = localStorage.getItem('reativa_token')
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${API_URL}/import/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'x-field-mapping': JSON.stringify(mapping) },
        body: formData,
      })

      if (!res.ok) throw new Error('Falha no upload')
      const { importJobId: jobId } = await res.json()
      setImportJobId(jobId)

      const poll = setInterval(async () => {
        const statusRes = await fetch(`${API_URL}/import/${jobId}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const status = await statusRes.json()
        setProgress({ processed: status.processedRows, total: status.totalRows })

        if (status.status === 'COMPLETED' || status.status === 'FAILED') {
          clearInterval(poll)
          setDone(true)
          setImporting(false)
        }
      }, 1500)
    } catch (err: any) {
      setError(err.message)
      setImporting(false)
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-5 pt-16">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--success-muted)' }}>
            <CheckCircle2 size={32} style={{ color: 'var(--success)' }} strokeWidth={1.5} />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-100">Importação concluída!</h3>
          <p className="text-slate-500 text-sm mt-1.5">
            {progress?.processed} pacientes importados com sucesso.
          </p>
        </div>
        <button
          onClick={() => { setFile(null); setDone(false); setProgress(null); setImportJobId(null) }}
          className="btn-primary mx-auto"
        >
          Importar outro arquivo
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Importar Pacientes</h2>
        <p className="text-slate-500 text-sm mt-1">Carregue sua planilha de pacientes (CSV ou Excel)</p>
      </div>

      {/* Dropzone */}
      {!file && (
        <div
          {...getRootProps()}
          className="rounded-2xl border-2 border-dashed p-14 text-center cursor-pointer transition-all"
          style={{
            borderColor: isDragActive ? 'var(--primary)' : 'rgba(148,163,184,0.15)',
            background: isDragActive ? 'var(--primary-muted)' : 'transparent',
          }}
        >
          <input {...getInputProps()} />
          <div className="flex justify-center mb-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors"
              style={{ background: isDragActive ? 'var(--primary)' : 'rgba(255,255,255,0.04)' }}
            >
              <UploadCloud size={24} style={{ color: isDragActive ? 'white' : '#475569' }} strokeWidth={1.5} />
            </div>
          </div>
          <p className="font-semibold text-slate-200">Arraste sua planilha aqui</p>
          <p className="text-slate-500 text-sm mt-1">ou clique para selecionar · CSV, XLS, XLSX</p>
        </div>
      )}

      {/* Arquivo + mapeamento */}
      {file && !importing && (
        <>
          <div className="card flex items-center gap-3 p-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary-muted)' }}>
              <FileSpreadsheet size={16} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{file.name}</p>
              <p className="text-xs text-slate-500">{preview.length}+ linhas detectadas</p>
            </div>
            <button onClick={() => setFile(null)} className="text-slate-600 hover:text-slate-400 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Mapeamento */}
          <div className="card p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Mapeamento de colunas</h3>
              <p className="text-xs text-slate-500 mt-0.5">Relacione as colunas da sua planilha com os campos do sistema</p>
            </div>
            {[...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].map((field) => (
              <div key={field} className="flex items-center gap-3">
                <label className={`${labelClass} w-44 flex-shrink-0`}>
                  {FIELD_LABELS[field]}
                  {REQUIRED_FIELDS.includes(field as any) && (
                    <span className="ml-1 text-xs" style={{ color: 'var(--danger)' }}>*</span>
                  )}
                </label>
                <select
                  value={mapping[field] || ''}
                  onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                  className={inputClass}
                >
                  <option value="">— selecionar coluna —</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Preview */}
          {preview.length > 0 && mapping.name && mapping.phone && (
            <div className="card p-4 overflow-x-auto">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Prévia dos primeiros registros</p>
              <table className="text-xs w-full">
                <thead>
                  <tr>
                    {['Nome', 'Telefone',
                      ...(mapping.lastAppointmentDate ? ['Última consulta'] : []),
                      ...(mapping.lastProcedure ? ['Procedimento'] : [])
                    ].map((h) => (
                      <th key={h} className="text-left text-slate-500 pb-2 pr-4 font-semibold uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      <td className="text-slate-300 pb-2 pr-4">{row[mapping.name] || '—'}</td>
                      <td className="text-slate-300 pb-2 pr-4">{row[mapping.phone] || '—'}</td>
                      {mapping.lastAppointmentDate && <td className="text-slate-400 pb-2 pr-4">{row[mapping.lastAppointmentDate] || '—'}</td>}
                      {mapping.lastProcedure && <td className="text-slate-400 pb-2">{row[mapping.lastProcedure] || '—'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error && (
            <div
              className="rounded-xl p-3 text-sm"
              style={{ background: 'var(--danger-muted)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={!mapping.name || !mapping.phone}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <UploadCloud size={16} />
            Importar pacientes
          </button>
        </>
      )}

      {/* Progresso */}
      {importing && progress && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--primary)' }} />
            <p className="text-sm font-semibold text-slate-200">Importando pacientes...</p>
          </div>
          <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: progress.total ? `${Math.round((progress.processed / progress.total) * 100)}%` : '10%',
                background: 'var(--primary)',
              }}
            />
          </div>
          <p className="text-xs text-slate-500">
            {progress.processed} de {progress.total ?? '?'} registros processados
          </p>
        </div>
      )}
    </div>
  )
}
