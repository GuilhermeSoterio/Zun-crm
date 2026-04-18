export interface PatientKanbanRow {
  id: string
  name: string
  phone: string
  lastAppointmentDate: string | null
  lastProcedure: string | null
  inactiveDays: number | null
  tags: string[]
  // cadência
  campaignStatus: 'PENDING' | 'IN_PROGRESS' | 'RESPONDED' | 'CONVERTED' | 'OPTED_OUT' | 'FAILED' | null
  campaignId: string | null
  campaignName: string | null
  campaignPatientId: string | null
  currentStep: number
  estimatedValue: number | null
  actualValue: number | null
}

export interface PatientRow {
  id: string
  name: string
  phone: string
  lastAppointmentDate: string | null
  lastProcedure: string | null
  inactiveDays: number | null
  optedOut: boolean
  tags: string[]
  createdAt: string
}

export interface ImportFieldMapping {
  name: string
  phone: string
  lastAppointmentDate?: string
  lastProcedure?: string
}

export interface ImportPreviewRow {
  [columnName: string]: string
}

export interface ImportJobStatus {
  id: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  totalRows: number | null
  processedRows: number
  errorRows: number
  filename: string
  createdAt: string
  completedAt: string | null
}
