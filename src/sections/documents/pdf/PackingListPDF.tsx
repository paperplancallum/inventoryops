'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer'
import type { PackingListDocumentSnapshot } from '../types'

// Styles for the PDF - using emerald theme for packing lists
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
    borderBottomColor: '#10b981',
    paddingBottom: 20,
  },
  companySection: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#78716c',
    lineHeight: 1.4,
  },
  documentSection: {
    alignItems: 'flex-end',
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  transferNumber: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  arrivalDate: {
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
    borderLeftColor: '#10b981',
  },
  infoBoxDestination: {
    borderLeftColor: '#3b82f6',
  },
  infoBoxShipping: {
    borderLeftColor: '#f59e0b',
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
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 15,
  },
  summaryBox: {
    flex: 1,
    padding: 15,
    backgroundColor: '#ecfdf5',
    borderRadius: 4,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#166534',
    marginTop: 4,
    textTransform: 'uppercase',
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
    backgroundColor: '#10b981',
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
  colSku: { width: '20%' },
  colProduct: { width: '35%' },
  colQty: { width: '15%', textAlign: 'right' },
  colCartons: { width: '15%', textAlign: 'right' },
  colWeight: { width: '15%', textAlign: 'right' },
  tableFooter: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f4',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  tableFooterCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1c1917',
  },
  instructionsSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#eff6ff',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  instructionsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 9,
    color: '#1e3a8a',
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
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  checklistTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e',
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
    borderColor: '#92400e',
    marginRight: 8,
    marginTop: 1,
  },
  checklistText: {
    fontSize: 9,
    color: '#78350f',
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

interface PackingListPDFProps {
  snapshot: PackingListDocumentSnapshot
  companyName?: string
  companyAddress?: string
}

export function PackingListPDFDocument({
  snapshot,
  companyName = 'Your Company',
  companyAddress = '123 Business St, City, Country',
}: PackingListPDFProps) {
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatWeight = (weight: number | undefined) => {
    if (!weight) return '-'
    return `${weight.toLocaleString()} kg`
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
          <View style={styles.documentSection}>
            <Text style={styles.documentTitle}>PACKING LIST</Text>
            <Text style={styles.transferNumber}>{snapshot.transferNumber}</Text>
            <Text style={styles.arrivalDate}>ETA: {formatDate(snapshot.scheduledArrivalDate)}</Text>
          </View>
        </View>

        {/* Location Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Ship From</Text>
            <Text style={styles.infoValue}>{snapshot.sourceLocationName}</Text>
          </View>
          <View style={[styles.infoBox, styles.infoBoxDestination]}>
            <Text style={styles.infoLabel}>Ship To</Text>
            <Text style={styles.infoValue}>{snapshot.destinationLocationName}</Text>
            {snapshot.destinationAddress && (
              <Text style={styles.infoValueSmall}>{snapshot.destinationAddress}</Text>
            )}
          </View>
        </View>

        {/* Shipping Info */}
        {(snapshot.carrier || snapshot.trackingNumber) && (
          <View style={styles.infoSection}>
            {snapshot.carrier && (
              <View style={[styles.infoBox, styles.infoBoxShipping]}>
                <Text style={styles.infoLabel}>Carrier</Text>
                <Text style={styles.infoValue}>{snapshot.carrier}</Text>
              </View>
            )}
            {snapshot.trackingNumber && (
              <View style={[styles.infoBox, styles.infoBoxShipping]}>
                <Text style={styles.infoLabel}>Tracking Number</Text>
                <Text style={styles.infoValue}>{snapshot.trackingNumber}</Text>
              </View>
            )}
          </View>
        )}

        {/* Summary Boxes */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{snapshot.totalCartons}</Text>
            <Text style={styles.summaryLabel}>Total Cartons</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{snapshot.totalUnits.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Total Units</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{snapshot.totalWeight ? `${snapshot.totalWeight}` : '-'}</Text>
            <Text style={styles.summaryLabel}>Total Weight (kg)</Text>
          </View>
        </View>

        {/* Contents Table */}
        <Text style={styles.sectionTitle}>Shipment Contents</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colSku]}>SKU</Text>
            <Text style={[styles.tableHeaderCell, styles.colProduct]}>Product</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Quantity</Text>
            <Text style={[styles.tableHeaderCell, styles.colCartons]}>Cartons</Text>
            <Text style={[styles.tableHeaderCell, styles.colWeight]}>Weight</Text>
          </View>
          {snapshot.lineItems.map((item, index) => (
            <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, styles.tableCellBold, styles.colSku]}>{item.sku}</Text>
              <Text style={[styles.tableCell, styles.colProduct]}>{item.productName}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{item.quantity.toLocaleString()}</Text>
              <Text style={[styles.tableCell, styles.colCartons]}>{item.cartonCount || '-'}</Text>
              <Text style={[styles.tableCell, styles.colWeight]}>{formatWeight(item.weight)}</Text>
            </View>
          ))}
          {/* Table Footer with Totals */}
          <View style={styles.tableFooter}>
            <Text style={[styles.tableFooterCell, styles.colSku]}></Text>
            <Text style={[styles.tableFooterCell, styles.colProduct]}>TOTALS</Text>
            <Text style={[styles.tableFooterCell, styles.colQty]}>{snapshot.totalUnits.toLocaleString()}</Text>
            <Text style={[styles.tableFooterCell, styles.colCartons]}>{snapshot.totalCartons}</Text>
            <Text style={[styles.tableFooterCell, styles.colWeight]}>{formatWeight(snapshot.totalWeight)}</Text>
          </View>
        </View>

        {/* Receiving Instructions */}
        {snapshot.receivingInstructions && (
          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsTitle}>Receiving Instructions</Text>
            <Text style={styles.instructionsText}>{snapshot.receivingInstructions}</Text>
          </View>
        )}

        {/* Receiving Checklist */}
        <View style={styles.checklistSection}>
          <Text style={styles.checklistTitle}>Receiving Checklist</Text>
          <View style={styles.checklistItem}>
            <View style={styles.checklistBox} />
            <Text style={styles.checklistText}>Count all cartons upon arrival (expected: {snapshot.totalCartons})</Text>
          </View>
          <View style={styles.checklistItem}>
            <View style={styles.checklistBox} />
            <Text style={styles.checklistText}>Check for visible damage to cartons</Text>
          </View>
          <View style={styles.checklistItem}>
            <View style={styles.checklistBox} />
            <Text style={styles.checklistText}>Verify total units match packing list ({snapshot.totalUnits.toLocaleString()} units)</Text>
          </View>
          <View style={styles.checklistItem}>
            <View style={styles.checklistBox} />
            <Text style={styles.checklistText}>Note any discrepancies on BOL before signing</Text>
          </View>
          <View style={styles.checklistItem}>
            <View style={styles.checklistBox} />
            <Text style={styles.checklistText}>Photograph any damaged items</Text>
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
            <Text style={styles.signatureLabel}>Received By (Signature & Date)</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Condition Notes / Exceptions</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated on {formatDate(new Date().toISOString())}</Text>
          <Text style={styles.footerText}>{snapshot.transferNumber}</Text>
        </View>
      </Page>
    </Document>
  )
}

// Utility function to generate PDF blob
export async function generatePackingListPDF(
  snapshot: PackingListDocumentSnapshot,
  companyName?: string,
  companyAddress?: string
): Promise<Blob> {
  const doc = (
    <PackingListPDFDocument
      snapshot={snapshot}
      companyName={companyName}
      companyAddress={companyAddress}
    />
  )

  return await pdf(doc).toBlob()
}

// Utility function to download PDF
export async function downloadPackingListPDF(
  snapshot: PackingListDocumentSnapshot,
  companyName?: string,
  companyAddress?: string
): Promise<void> {
  const blob = await generatePackingListPDF(snapshot, companyName, companyAddress)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `packing-list-${snapshot.transferNumber}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
