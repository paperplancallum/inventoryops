// Stub types for payment milestones used by inspections
// Full implementation will come with the invoices-and-payments section

export type PaymentMilestoneTrigger =
  | 'po-confirmed'
  | 'inspection-passed'
  | 'customs-cleared'
  | 'shipment-departed'
  | 'goods-received'
  | 'manual'
  | 'upfront'

export interface PaymentMilestone {
  id: string
  name: string
  percentage: number
  trigger: PaymentMilestoneTrigger
  offsetDays: number
}

export interface PaymentTermsTemplate {
  id: string
  name: string
  description: string
  milestones: PaymentMilestone[]
  isDefault?: boolean
}

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overdue'
