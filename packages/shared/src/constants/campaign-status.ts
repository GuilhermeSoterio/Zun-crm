export const CAMPAIGN_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
} as const

export type CampaignStatus = keyof typeof CAMPAIGN_STATUS

export const CAMPAIGN_PATIENT_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  RESPONDED: 'RESPONDED',
  CONVERTED: 'CONVERTED',
  OPTED_OUT: 'OPTED_OUT',
  FAILED: 'FAILED',
} as const

export type CampaignPatientStatus = keyof typeof CAMPAIGN_PATIENT_STATUS
