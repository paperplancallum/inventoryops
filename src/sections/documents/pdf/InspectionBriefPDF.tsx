'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer'
import type { InspectionBriefSnapshot } from '../types'

// Styles for the PDF - using cyan theme for inspections
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1c1917',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#0891b2',
    paddingBottom: 20,
  },
  companySection: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0891b2',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#78716c',
    lineHeight: 1.4,
  },
  briefSection: {
    alignItems: 'flex-end',
  },
  briefTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  inspectionNumber: {
    fontSize: 14,
    color: '#0891b2',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  poReference: {
    fontSize: 10,
    color: '#78716c',
  },
  infoSection: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 15,
  },
  infoBox: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fafaf9',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#0891b2',
  },
  infoBoxSupplier: {
    borderLeftColor: '#f59e0b',
  },
  infoBoxAgent: {
    borderLeftColor: '#22c55e',
  },
  infoLabel: {
    fontSize: 8,
    color: '#78716c',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1c1917',
  },
  infoValueSmall: {
    fontSize: 9,
    color: '#57534e',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1c1917',
    marginBottom: 10,
    marginTop: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e7e5e4',
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0891b2',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e7e5e4',
    backgroundColor: '#ffffff',
  },
  tableRowAlt: {
    backgroundColor: '#fafaf9',
  },
  tableCell: {
    fontSize: 9,
    color: '#44403c',
  },
  tableCellBold: {
    fontWeight: 'bold',
  },
  colSku: { width: '18%' },
  colProduct: { width: '32%' },
  colQty: { width: '12%', textAlign: 'right' },
  colSample: { width: '12%', textAlign: 'right' },
  colCriteria: { width: '26%' },
  instructionsSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  instructionsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 9,
    color: '#78350f',
    lineHeight: 1.5,
  },
  notesSection: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f5f5f4',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#44403c',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#57534e',
    lineHeight: 1.5,
  },
  checklistSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#ecfdf5',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  checklistTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  checklistBox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#166534',
    marginRight: 8,
    marginTop: 1,
  },
  checklistText: {
    fontSize: 9,
    color: '#15803d',
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e7e5e4',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#a8a29e',
  },
  signatureSection: {
    marginTop: 30,
    flexDirection: 'row',
    gap: 30,
  },
  signatureBox: {
    flex: 1,
    paddingTop: 40,
    borderTopWidth: 1,
    borderTopColor: '#d6d3d1',
  },
  signatureLabel: {
    fontSize: 9,
    color: '#78716c',
    textAlign: 'center',
  },
})

interface InspectionBriefPDFProps {
  snapshot: InspectionBriefSnapshot
  companyName?: string
  companyAddress?: string
}

export function InspectionBriefPDFDocument({
  snapshot,
  companyName = 'Your Company',
  companyAddress = '123 Business St, City, Country',
}: InspectionBriefPDFProps) {
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companySection}>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companyDetails}>{companyAddress}</Text>
          </View>
          <View style={styles.briefSection}>
            <Text style={styles.briefTitle}>INSPECTION BRIEF</Text>
            <Text style={styles.inspectionNumber}>{snapshot.inspectionNumber}</Text>
            <Text style={styles.poReference}>PO: {snapshot.purchaseOrderNumber}</Text>
          </View>
        </View>

        {/* Inspection Details */}
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Inspection Date</Text>
            <Text style={styles.infoValue}>{formatDate(snapshot.scheduledDate)}</Text>
            <Text style={styles.infoValueSmall}>{snapshot.inspectionType || 'Pre-Shipment Inspection'}</Text>
          </View>
        </View>

        {/* Supplier & Agent Info */}
        <View style={styles.infoSection}>
          <View style={[styles.infoBox, styles.infoBoxSupplier]}>
            <Text style={styles.infoLabel}>Factory / Supplier</Text>
            <Text style={styles.infoValue}>{snapshot.supplierName}</Text>
            {snapshot.supplierAddress && (
              <Text style={styles.infoValueSmall}>{snapshot.supplierAddress}</Text>
            )}
            {snapshot.supplierPhone && (
              <Text style={styles.infoValueSmall}>Tel: {snapshot.supplierPhone}</Text>
            )}
            {snapshot.supplierContactPerson && (
              <Text style={styles.infoValueSmall}>Contact: {snapshot.supplierContactPerson}</Text>
            )}
          </View>
          <View style={[styles.infoBox, styles.infoBoxAgent]}>
            <Text style={styles.infoLabel}>Inspection Agent</Text>
            <Text style={styles.infoValue}>{snapshot.agentName}</Text>
            {snapshot.agentCompany && (
              <Text style={styles.infoValueSmall}>{snapshot.agentCompany}</Text>
            )}
            {snapshot.agentEmail && (
              <Text style={styles.infoValueSmall}>{snapshot.agentEmail}</Text>
            )}
            {snapshot.agentPhone && (
              <Text style={styles.infoValueSmall}>Tel: {snapshot.agentPhone}</Text>
            )}
          </View>
        </View>

        {/* Products to Inspect */}
        <Text style={styles.sectionTitle}>Products to Inspect</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colSku]}>SKU</Text>
            <Text style={[styles.tableHeaderCell, styles.colProduct]}>Product</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Order Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colSample]}>Sample</Text>
            <Text style={[styles.tableHeaderCell, styles.colCriteria]}>Inspection Criteria</Text>
          </View>
          {snapshot.lineItems.map((item, index) => (
            <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, styles.tableCellBold, styles.colSku]}>{item.productSku}</Text>
              <Text style={[styles.tableCell, styles.colProduct]}>{item.productName}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{item.orderedQuantity.toLocaleString()}</Text>
              <Text style={[styles.tableCell, styles.colSample]}>{item.sampleSize || '-'}</Text>
              <Text style={[styles.tableCell, styles.colCriteria]}>{item.inspectionCriteria || 'Standard AQL 2.5'}</Text>
            </View>
          ))}
        </View>

        {/* Special Instructions */}
        {snapshot.specialInstructions && (
          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsTitle}>Special Instructions</Text>
            <Text style={styles.instructionsText}>{snapshot.specialInstructions}</Text>
          </View>
        )}

        {/* Standard Checklist */}
        <View style={styles.checklistSection}>
          <Text style={styles.checklistTitle}>Standard Inspection Checklist</Text>
          <View style={styles.checklistItem}>
            <View style={styles.checklistBox} />
            <Text style={styles.checklistText}>Verify production quantity matches order quantity</Text>
          </View>
          <View style={styles.checklistItem}>
            <View style={styles.checklistBox} />
            <Text style={styles.checklistText}>Check product appearance and finish quality</Text>
          </View>
          <View style={styles.checklistItem}>
            <View style={styles.checklistBox} />
            <Text style={styles.checklistText}>Verify dimensions against specifications</Text>
          </View>
          <View style={styles.checklistItem}>
            <View style={styles.checklistBox} />
            <Text style={styles.checklistText}>Test functionality (if applicable)</Text>
          </View>
          <View style={styles.checklistItem}>
            <View style={styles.checklistBox} />
            <Text style={styles.checklistText}>Check packaging and labeling accuracy</Text>
          </View>
          <View style={styles.checklistItem}>
            <View style={styles.checklistBox} />
            <Text style={styles.checklistText}>Photograph any defects found</Text>
          </View>
        </View>

        {/* Notes */}
        {snapshot.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Additional Notes</Text>
            <Text style={styles.notesText}>{snapshot.notes}</Text>
          </View>
        )}

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Inspector Signature & Date</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Factory Representative & Date</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated on {formatDate(new Date().toISOString())}</Text>
          <Text style={styles.footerText}>{snapshot.inspectionNumber}</Text>
        </View>
      </Page>
    </Document>
  )
}

// Utility function to generate PDF blob
export async function generateInspectionBriefPDF(
  snapshot: InspectionBriefSnapshot,
  companyName?: string,
  companyAddress?: string
): Promise<Blob> {
  const doc = (
    <InspectionBriefPDFDocument
      snapshot={snapshot}
      companyName={companyName}
      companyAddress={companyAddress}
    />
  )

  return await pdf(doc).toBlob()
}

// Utility function to download PDF
export async function downloadInspectionBriefPDF(
  snapshot: InspectionBriefSnapshot,
  companyName?: string,
  companyAddress?: string
): Promise<void> {
  const blob = await generateInspectionBriefPDF(snapshot, companyName, companyAddress)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `inspection-brief-${snapshot.inspectionNumber}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
