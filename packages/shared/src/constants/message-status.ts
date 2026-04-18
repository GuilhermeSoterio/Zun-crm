export const MESSAGE_STATUS = {
  QUEUED: 'QUEUED',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
} as const

export type MessageStatus = keyof typeof MESSAGE_STATUS

export const MESSAGE_DIRECTION = {
  OUTBOUND: 'OUTBOUND',
  INBOUND: 'INBOUND',
} as const

export type MessageDirection = keyof typeof MESSAGE_DIRECTION

export const AI_CLASSIFICATION = {
  INTERESTED: 'interested',
  NOT_INTERESTED: 'not_interested',
  QUESTION: 'question',
  RESCHEDULE: 'reschedule',
  OPT_OUT: 'opt_out',
  OTHER: 'other',
} as const

export type AiClassification = typeof AI_CLASSIFICATION[keyof typeof AI_CLASSIFICATION]
