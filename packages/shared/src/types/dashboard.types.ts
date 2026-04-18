export interface FunnelData {
  pending: number
  inProgress: number
  responded: number
  converted: number
}

export interface DailyDispatches {
  date: string
  count: number
}

export interface AiBreakdown {
  interested: number
  not_interested: number
  question: number
  reschedule: number
  opt_out: number
  other: number
}

export interface DashboardData {
  funnel: FunnelData
  totalRevenue: number
  totalPatients: number
  timeline: DailyDispatches[]
  aiBreakdown: AiBreakdown
  activeCampaigns: number
}
