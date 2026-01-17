import { describe, it, expect, vi, beforeEach } from 'vitest'
import type {
  Inspection,
  InspectionAgent,
  InspectionLineItem,
  InspectionSummary,
  ReworkRequest,
  Defect,
  MeasurementCheck,
  PackagingCheck,
  InspectionStatus,
  DefectSeverity,
  LineItemResult,
  ScheduleInspectionFormData,
  InspectionAgentFormData,
  INSPECTION_STATUS_OPTIONS,
} from './types'

// =============================================================================
// Sample Test Data
// =============================================================================

const sampleDefect: Defect = {
  id: 'def-001',
  type: 'cosmetic',
  description: 'Minor scratch on lid',
  quantity: 2,
  severity: 'minor',
  photoIds: ['photo-001'],
}

const sampleMeasurement: MeasurementCheck = {
  id: 'meas-001',
  name: 'Height',
  specValue: '250mm',
  actualValue: '249mm',
  passed: true,
}

const samplePackaging: PackagingCheck = {
  boxCondition: 'good',
  labelingAccuracy: true,
  barcodeScans: true,
  notes: 'All barcodes scan correctly',
}

const sampleLineItem: InspectionLineItem = {
  id: 'ili-001',
  productName: 'Water Bottle 20oz Black',
  productSku: 'WB-20OZ-BLK',
  orderedQuantity: 1000,
  sampleSize: 200,
  defectsFound: 3,
  defectRate: 1.5,
  result: 'pass',
  defects: [
    sampleDefect,
    {
      id: 'def-002',
      type: 'labeling',
      description: 'Label slightly off-center',
      quantity: 1,
      severity: 'minor',
      photoIds: [],
    },
  ],
  measurements: [sampleMeasurement],
  packaging: samplePackaging,
  photos: [],
}

const sampleInspection: Inspection = {
  id: 'insp-001',
  inspectionNumber: 'INS-24-0001',
  purchaseOrderId: 'po-001',
  purchaseOrderNumber: 'PO-2024-0042',
  supplierName: 'Shenzhen Manufacturing',
  scheduledDate: '2024-02-15',
  confirmedDate: '2024-02-14',
  completedDate: '2024-02-15',
  agentId: 'agent-001',
  agentName: 'Li Wei',
  status: 'passed',
  lineItems: [sampleLineItem],
  result: 'pass',
  overallDefectRate: 1.5,
  totalSampleSize: 200,
  reworkRequest: null,
  notes: 'Good quality batch, minor cosmetic issues only',
  invoiceId: 'inv-001',
  invoiceAmount: 149,
}

const sampleAgent: InspectionAgent = {
  id: 'agent-001',
  name: 'Li Wei',
  email: 'liwei@qima.com',
  phone: '+86 755 8888 1234',
  company: 'QIMA',
  location: 'Shenzhen',
  hourlyRate: 45,
  specialties: ['Electronics', 'Packaging', 'Drinkware'],
  notes: 'Reliable inspector, 5+ years experience',
  isActive: true,
  paymentTermsTemplateId: 'template-upfront',
}

const sampleReworkRequest: ReworkRequest = {
  id: 'rework-001',
  createdDate: '2024-02-15',
  instructions: 'Replace damaged labels on 15 units. Re-seal packaging for units with torn shrink wrap.',
  supplierResponse: 'Will complete by Feb 20',
  completedDate: null,
  status: 'in-progress',
}

// =============================================================================
// Type Tests
// =============================================================================

describe('Inspection Types', () => {
  describe('InspectionStatus', () => {
    it('should have all required status values', () => {
      const statuses: InspectionStatus[] = [
        'scheduled',
        'pending-confirmation',
        'confirmed',
        'paid',
        'in-progress',
        'report-submitted',
        'passed',
        'failed',
        'pending-rework',
        're-inspection',
      ]
      expect(statuses).toHaveLength(10)
    })
  })

  describe('DefectSeverity', () => {
    it('should support all severity levels', () => {
      const severities: DefectSeverity[] = ['minor', 'major', 'critical']
      expect(severities).toHaveLength(3)
    })
  })

  describe('LineItemResult', () => {
    it('should support all result values', () => {
      const results: LineItemResult[] = ['pass', 'fail', 'pending']
      expect(results).toHaveLength(3)
    })
  })
})

// =============================================================================
// Data Structure Tests
// =============================================================================

describe('Inspection Data Structure', () => {
  describe('Inspection', () => {
    it('should have valid required fields', () => {
      expect(sampleInspection.id).toBe('insp-001')
      expect(sampleInspection.purchaseOrderId).toBe('po-001')
      expect(sampleInspection.purchaseOrderNumber).toBe('PO-2024-0042')
      expect(sampleInspection.supplierName).toBe('Shenzhen Manufacturing')
      expect(sampleInspection.scheduledDate).toBe('2024-02-15')
      expect(sampleInspection.agentName).toBe('Li Wei')
      expect(sampleInspection.status).toBe('passed')
    })

    it('should have line items with correct structure', () => {
      expect(sampleInspection.lineItems).toHaveLength(1)
      const lineItem = sampleInspection.lineItems[0]
      expect(lineItem.productName).toBe('Water Bottle 20oz Black')
      expect(lineItem.sampleSize).toBe(200)
      expect(lineItem.defectsFound).toBe(3)
      expect(lineItem.result).toBe('pass')
    })

    it('should calculate defect rate correctly', () => {
      const lineItem = sampleInspection.lineItems[0]
      const expectedRate = (lineItem.defectsFound / lineItem.sampleSize) * 100
      expect(lineItem.defectRate).toBeCloseTo(expectedRate, 1)
    })
  })

  describe('InspectionAgent', () => {
    it('should have valid required fields', () => {
      expect(sampleAgent.id).toBe('agent-001')
      expect(sampleAgent.name).toBe('Li Wei')
      expect(sampleAgent.email).toBe('liwei@qima.com')
      expect(sampleAgent.company).toBe('QIMA')
      expect(sampleAgent.isActive).toBe(true)
    })

    it('should have specialties as array', () => {
      expect(Array.isArray(sampleAgent.specialties)).toBe(true)
      expect(sampleAgent.specialties).toContain('Electronics')
      expect(sampleAgent.specialties).toContain('Packaging')
    })

    it('should have hourly rate as number', () => {
      expect(typeof sampleAgent.hourlyRate).toBe('number')
      expect(sampleAgent.hourlyRate).toBe(45)
    })
  })

  describe('ReworkRequest', () => {
    it('should have valid structure', () => {
      expect(sampleReworkRequest.id).toBe('rework-001')
      expect(sampleReworkRequest.status).toBe('in-progress')
      expect(sampleReworkRequest.instructions).toBeTruthy()
    })

    it('should support null completed date for pending/in-progress', () => {
      expect(sampleReworkRequest.completedDate).toBeNull()
      expect(['pending', 'in-progress']).toContain(sampleReworkRequest.status)
    })
  })
})

// =============================================================================
// Business Logic Tests
// =============================================================================

describe('Inspection Business Logic', () => {
  describe('Status Workflow', () => {
    it('scheduled inspection should be pending agent confirmation', () => {
      const inspection: Inspection = {
        ...sampleInspection,
        status: 'scheduled',
        confirmedDate: null,
        completedDate: null,
      }
      expect(inspection.status).toBe('scheduled')
      expect(inspection.confirmedDate).toBeNull()
    })

    it('confirmed inspection should have confirmed date', () => {
      const inspection: Inspection = {
        ...sampleInspection,
        status: 'confirmed',
        confirmedDate: '2024-02-14',
        completedDate: null,
      }
      expect(inspection.status).toBe('confirmed')
      expect(inspection.confirmedDate).toBeTruthy()
    })

    it('completed inspection should have completed date', () => {
      expect(sampleInspection.completedDate).toBe('2024-02-15')
      expect(['passed', 'failed']).toContain(sampleInspection.status)
    })

    it('failed inspection can have rework request', () => {
      const failedInspection: Inspection = {
        ...sampleInspection,
        status: 'pending-rework',
        result: 'fail',
        reworkRequest: sampleReworkRequest,
      }
      expect(failedInspection.reworkRequest).not.toBeNull()
      expect(failedInspection.status).toBe('pending-rework')
    })

    it('re-inspection should reference original inspection', () => {
      const reInspection: Inspection = {
        ...sampleInspection,
        id: 'insp-002',
        status: 're-inspection',
        originalInspectionId: 'insp-001',
        completedDate: null,
      }
      expect(reInspection.originalInspectionId).toBe('insp-001')
      expect(reInspection.status).toBe('re-inspection')
    })
  })

  describe('Defect Rate Calculation', () => {
    it('should calculate defect rate as percentage', () => {
      const sampleSize = 200
      const defectsFound = 5
      const expectedRate = (defectsFound / sampleSize) * 100
      expect(expectedRate).toBe(2.5)
    })

    it('should handle zero sample size', () => {
      const lineItem: InspectionLineItem = {
        ...sampleLineItem,
        sampleSize: 0,
        defectsFound: 0,
        defectRate: 0,
      }
      expect(lineItem.defectRate).toBe(0)
    })

    it('should aggregate overall defect rate from line items', () => {
      const lineItems: InspectionLineItem[] = [
        { ...sampleLineItem, sampleSize: 100, defectsFound: 2 },
        { ...sampleLineItem, id: 'ili-002', sampleSize: 100, defectsFound: 3 },
      ]
      const totalSamples = lineItems.reduce((sum, li) => sum + li.sampleSize, 0)
      const totalDefects = lineItems.reduce((sum, li) => sum + li.defectsFound, 0)
      const overallRate = (totalDefects / totalSamples) * 100
      expect(overallRate).toBe(2.5)
    })
  })

  describe('Agent Availability', () => {
    it('active agent should be available for scheduling', () => {
      expect(sampleAgent.isActive).toBe(true)
    })

    it('inactive agent should not be available for scheduling', () => {
      const inactiveAgent: InspectionAgent = {
        ...sampleAgent,
        isActive: false,
      }
      expect(inactiveAgent.isActive).toBe(false)
    })
  })

  describe('Rework Workflow', () => {
    it('rework request should start with pending status', () => {
      const newRework: ReworkRequest = {
        ...sampleReworkRequest,
        status: 'pending',
        supplierResponse: null,
        completedDate: null,
      }
      expect(newRework.status).toBe('pending')
    })

    it('completed rework should have completed date', () => {
      const completedRework: ReworkRequest = {
        ...sampleReworkRequest,
        status: 'completed',
        completedDate: '2024-02-20',
      }
      expect(completedRework.status).toBe('completed')
      expect(completedRework.completedDate).toBe('2024-02-20')
    })
  })

  describe('Invoice Integration', () => {
    it('confirmed inspection should have invoice amount', () => {
      const inspection: Inspection = {
        ...sampleInspection,
        status: 'confirmed',
        invoiceAmount: 149,
      }
      expect(inspection.invoiceAmount).toBe(149)
    })

    it('paid inspection should have invoice ID', () => {
      const inspection: Inspection = {
        ...sampleInspection,
        status: 'paid',
        invoiceId: 'inv-001',
      }
      expect(inspection.invoiceId).toBe('inv-001')
    })
  })
})

// =============================================================================
// Summary Calculation Tests
// =============================================================================

describe('Inspection Summary', () => {
  const mockInspections: Inspection[] = [
    { ...sampleInspection, id: '1', status: 'scheduled' },
    { ...sampleInspection, id: '2', status: 'scheduled' },
    { ...sampleInspection, id: '3', status: 'pending-confirmation' },
    { ...sampleInspection, id: '4', status: 'confirmed' },
    { ...sampleInspection, id: '5', status: 'paid' },
    { ...sampleInspection, id: '6', status: 'in-progress' },
    { ...sampleInspection, id: '7', status: 'report-submitted' },
    { ...sampleInspection, id: '8', status: 'passed', overallDefectRate: 1.5 },
    { ...sampleInspection, id: '9', status: 'passed', overallDefectRate: 2.0 },
    { ...sampleInspection, id: '10', status: 'failed', overallDefectRate: 5.0 },
    { ...sampleInspection, id: '11', status: 'pending-rework' },
    { ...sampleInspection, id: '12', status: 're-inspection' },
  ]

  function calculateSummary(inspections: Inspection[]): InspectionSummary {
    const completedInspections = inspections.filter(
      i => i.status === 'passed' || i.status === 'failed'
    )
    const avgDefectRate =
      completedInspections.length > 0
        ? completedInspections.reduce((sum, i) => sum + i.overallDefectRate, 0) /
          completedInspections.length
        : 0

    return {
      total: inspections.length,
      scheduled: inspections.filter(i => i.status === 'scheduled').length,
      pendingConfirmation: inspections.filter(i => i.status === 'pending-confirmation').length,
      confirmed: inspections.filter(i => i.status === 'confirmed').length,
      paid: inspections.filter(i => i.status === 'paid').length,
      inProgress: inspections.filter(i => i.status === 'in-progress').length,
      reportSubmitted: inspections.filter(i => i.status === 'report-submitted').length,
      passed: inspections.filter(i => i.status === 'passed').length,
      failed: inspections.filter(i => i.status === 'failed').length,
      pendingRework: inspections.filter(i => i.status === 'pending-rework').length,
      reInspection: inspections.filter(i => i.status === 're-inspection').length,
      avgDefectRate,
    }
  }

  it('should calculate correct totals', () => {
    const summary = calculateSummary(mockInspections)
    expect(summary.total).toBe(12)
    expect(summary.scheduled).toBe(2)
    expect(summary.pendingConfirmation).toBe(1)
    expect(summary.confirmed).toBe(1)
    expect(summary.paid).toBe(1)
    expect(summary.inProgress).toBe(1)
    expect(summary.reportSubmitted).toBe(1)
    expect(summary.passed).toBe(2)
    expect(summary.failed).toBe(1)
    expect(summary.pendingRework).toBe(1)
    expect(summary.reInspection).toBe(1)
  })

  it('should calculate average defect rate from completed inspections only', () => {
    const summary = calculateSummary(mockInspections)
    // (1.5 + 2.0 + 5.0) / 3 = 2.833...
    expect(summary.avgDefectRate).toBeCloseTo(2.83, 1)
  })

  it('should handle empty inspections list', () => {
    const summary = calculateSummary([])
    expect(summary.total).toBe(0)
    expect(summary.avgDefectRate).toBe(0)
  })
})

// =============================================================================
// Form Data Validation Tests
// =============================================================================

describe('Form Data Validation', () => {
  describe('ScheduleInspectionFormData', () => {
    it('should have required fields', () => {
      const formData: ScheduleInspectionFormData = {
        purchaseOrderId: 'po-001',
        agentId: 'agent-001',
        scheduledDate: '2024-02-15',
        notes: 'Pre-shipment inspection',
      }
      expect(formData.purchaseOrderId).toBeTruthy()
      expect(formData.scheduledDate).toBeTruthy()
    })

    it('should support optional line item selection', () => {
      const formData: ScheduleInspectionFormData = {
        purchaseOrderId: 'po-001',
        agentId: 'agent-001',
        scheduledDate: '2024-02-15',
        selectedLineItemIds: ['li-001', 'li-002'],
      }
      expect(formData.selectedLineItemIds).toHaveLength(2)
    })

    it('should allow unassigned agent', () => {
      const formData: ScheduleInspectionFormData = {
        purchaseOrderId: 'po-001',
        agentId: null,
        scheduledDate: '2024-02-15',
      }
      expect(formData.agentId).toBeNull()
    })
  })

  describe('InspectionAgentFormData', () => {
    it('should have required fields', () => {
      const formData: InspectionAgentFormData = {
        name: 'John Inspector',
        email: 'john@qima.com',
        phone: '+86 755 1234 5678',
        company: 'QIMA',
        location: 'Shenzhen',
        hourlyRate: 45,
        specialties: ['Electronics'],
        notes: '',
      }
      expect(formData.name).toBeTruthy()
      expect(formData.email).toBeTruthy()
      expect(formData.hourlyRate).toBeGreaterThan(0)
    })

    it('should support empty specialties', () => {
      const formData: InspectionAgentFormData = {
        name: 'New Inspector',
        email: 'new@test.com',
        phone: '',
        company: '',
        location: '',
        hourlyRate: 0,
        specialties: [],
        notes: '',
      }
      expect(formData.specialties).toHaveLength(0)
    })
  })
})

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge Cases', () => {
  describe('Inspection with Many Line Items', () => {
    it('should handle 20+ line items', () => {
      const manyLineItems: InspectionLineItem[] = Array.from({ length: 20 }, (_, i) => ({
        ...sampleLineItem,
        id: `ili-${i + 1}`,
        productName: `Product ${i + 1}`,
        productSku: `SKU-${i + 1}`,
      }))
      const inspection: Inspection = {
        ...sampleInspection,
        lineItems: manyLineItems,
      }
      expect(inspection.lineItems).toHaveLength(20)
    })
  })

  describe('Defect Severity Handling', () => {
    it('should handle critical defects', () => {
      const criticalDefect: Defect = {
        ...sampleDefect,
        severity: 'critical',
        description: 'Product fails safety test',
      }
      expect(criticalDefect.severity).toBe('critical')
    })

    it('should support multiple defects of same type', () => {
      const defects: Defect[] = [
        { ...sampleDefect, id: '1', quantity: 5 },
        { ...sampleDefect, id: '2', quantity: 3 },
      ]
      const totalQuantity = defects.reduce((sum, d) => sum + d.quantity, 0)
      expect(totalQuantity).toBe(8)
    })
  })

  describe('Magic Link Expiration', () => {
    it('should have expiration date for magic link', () => {
      const inspection: Inspection = {
        ...sampleInspection,
        status: 'pending-confirmation',
        magicLinkToken: 'abc123',
        magicLinkExpiresAt: '2024-02-22T00:00:00Z',
      }
      expect(inspection.magicLinkToken).toBeTruthy()
      expect(inspection.magicLinkExpiresAt).toBeTruthy()
    })
  })

  describe('Re-inspection Chain', () => {
    it('should track original inspection ID', () => {
      const originalId = 'insp-001'
      const reInspection: Inspection = {
        ...sampleInspection,
        id: 'insp-002',
        status: 're-inspection',
        originalInspectionId: originalId,
      }
      expect(reInspection.originalInspectionId).toBe(originalId)
    })
  })
})
