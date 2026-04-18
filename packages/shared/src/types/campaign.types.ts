import type { CampaignStatus, CampaignPatientStatus } from '../constants/campaign-status'

export interface TargetFilter {
  inactiveDays: number
  procedures: string[]
  tags: string[]
}

export interface CampaignSummary {
  id: string
  name: string
  status: CampaignStatus
  totalPatients: number
  pending: number
  inProgress: number
  responded: number
  converted: number
  estimatedRevenue: number
  createdAt: string
  startedAt: string | null
}

export interface MessageSequenceInput {
  stepNumber: 1 | 2 | 3
  delayDays: 0 | 3 | 7
  templateBody: string
}

export interface CreateCampaignInput {
  name: string
  targetFilter: TargetFilter
  sequences: MessageSequenceInput[]
  avgTicket: number
}

export interface CampaignPatientRow {
  id: string
  patientName: string
  phone: string
  lastAppointmentDate: string | null
  lastProcedure: string | null
  inactiveDays: number | null
  status: CampaignPatientStatus
  currentStep: number
  convertedAt: string | null
  estimatedValue: number | null
  actualValue: number | null
  convertedNote: string | null
}

export interface ProcedurePrice {
  id: string
  procedureName: string
  price: number
}

export interface ConvertPatientInput {
  actualValue: number
  note?: string
}
