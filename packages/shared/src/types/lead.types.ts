export interface LeadKanbanRow {
  id: string
  name: string
  phone: string | null
  email: string | null
  source: string | null
  estimatedValue: number | null
  status: 'ACTIVE' | 'WON' | 'LOST'
  stageId: string
  funnelId: string
  daysInStage: number
  createdAt: string
}

export interface LeadActivity {
  id: string
  type: 'created' | 'stage_change' | 'note' | 'won' | 'lost'
  data: Record<string, unknown> | null
  createdAt: string
}

export interface LeadDetail extends LeadKanbanRow {
  notes: string | null
  wonAt: string | null
  lostAt: string | null
  lostReason: string | null
  patientId: string | null
  activities: LeadActivity[]
}

export interface FunnelStage {
  id: string
  name: string
  color: string
  order: number
  isWon: boolean
  isLost: boolean
  leadCount: number
}

export interface FunnelWithStages {
  id: string
  name: string
  color: string
  order: number
  stages: FunnelStage[]
  totalLeads: number
}
