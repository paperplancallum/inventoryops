'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer'
import type { Transfer, TransferStatusOption, ShippingMethodOption } from './types'

// Styles for the PDF - using lime green theme to match the app
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
    borderBottomColor: '#65a30d',
    paddingBottom: 20,
  },
  companySection: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#65a30d',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#78716c',
    lineHeight: 1.4,
  },
  manifestSection: {
    alignItems: 'flex-end',
  },
  manifestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  transferNumber: {
    fontSize: 14,
    color: '#65a30d',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statusDraft: { backgroundColor: '#f5f5f4', color: '#78716c' },
  statusBooked: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
  statusInTransit: { backgroundColor: '#fef3c7', color: '#d97706' },
  statusDelivered: { backgroundColor: '#d1fae5', color: '#059669' },
  statusCompleted: { backgroundColor: '#dcfce7', color: '#16a34a' },
  statusCancelled: { backgroundColor: '#fee2e2', color: '#dc2626' },
  infoSection: {
    flexDirection: 'row',
    marginBottom: 25,
    gap: 15,
  },
  infoBox: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fafaf9',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#65a30d',
  },
  infoBoxDestination: {
    borderLeftColor: '#0891b2',
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
  shippingSection: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 15,
  },
  shippingBox: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f5f5f4',
    borderRadius: 4,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#65a30d',
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
  colProduct: { width: '37%' },
  colQty: { width: '15%', textAlign: 'right' },
  colUnitCost: { width: '15%', textAlign: 'right' },
  colTotal: { width: '15%', textAlign: 'right' },
  costsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  costsBox: {
    width: 220,
    backgroundColor: '#fafaf9',
    borderRadius: 4,
    padding: 15,
  },
  costsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  costsLabel: {
    fontSize: 9,
    color: '#78716c',
  },
  costsValue: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  costsTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 5,
    borderTopWidth: 2,
    borderTopColor: '#65a30d',
  },
  costsTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1c1917',
  },
  costsTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#65a30d',
  },
  trackingSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  trackingTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  trackingRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  trackingLabel: {
    fontSize: 9,
    color: '#1e40af',
    fontWeight: 'bold',
    width: 80,
  },
  trackingValue: {
    fontSize: 9,
    color: '#1e3a8a',
  },
  customsSection: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#fefce8',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#eab308',
  },
  customsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#854d0e',
    marginBottom: 8,
  },
  customsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  customsLabel: {
    fontSize: 9,
    color: '#854d0e',
    fontWeight: 'bold',
    width: 100,
  },
  customsValue: {
    fontSize: 9,
    color: '#713f12',
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

interface TransferManifestPDFProps {
  transfer: Transfer
  transferStatuses: TransferStatusOption[]
  shippingMethods: ShippingMethodOption[]
  companyName?: string
  companyAddress?: string
}

// Get status style based on transfer status
function getStatusStyle(status: string) {
  switch (status) {
    case 'draft': return styles.statusDraft
    case 'booked': return styles.statusBooked
    case 'in-transit': return styles.statusInTransit
    case 'delivered': return styles.statusDelivered
    case 'completed': return styles.statusCompleted
    case 'cancelled': return styles.statusCancelled
    default: return styles.statusDraft
  }
}

// PDF Document component
export function TransferManifestPDFDocument({
  transfer,
  transferStatuses,
  shippingMethods,
  companyName = 'Your Company',
  companyAddress = '123 Business St, City, Country',
}: TransferManifestPDFProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const statusLabel = transferStatuses.find(s => s.id === transfer.status)?.label || transfer.status
  const methodLabel = shippingMethods.find(m => m.id === transfer.shippingMethod)?.label || transfer.shippingMethod || '-'

  const totalCosts = transfer.costs.freight + transfer.costs.insurance + transfer.costs.duties +
    transfer.costs.taxes + transfer.costs.handling + transfer.costs.other

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companySection}>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companyDetails}>{companyAddress}</Text>
          </View>
          <View style={styles.manifestSection}>
            <Text style={styles.manifestTitle}>SHIPPING MANIFEST</Text>
            <Text style={styles.transferNumber}>{transfer.transferNumber}</Text>
            <View style={[styles.statusBadge, getStatusStyle(transfer.status)]}>
              <Text>{statusLabel}</Text>
            </View>
          </View>
        </View>

        {/* Location Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Ship From</Text>
            <Text style={styles.infoValue}>{transfer.sourceLocationName || 'Unknown'}</Text>
            <Text style={styles.infoValueSmall}>{transfer.sourceLocationType || ''}</Text>
          </View>
          <View style={[styles.infoBox, styles.infoBoxDestination]}>
            <Text style={styles.infoLabel}>Ship To</Text>
            <Text style={styles.infoValue}>{transfer.destinationLocationName || 'Unknown'}</Text>
            <Text style={styles.infoValueSmall}>{transfer.destinationLocationType || ''}</Text>
          </View>
        </View>

        {/* Shipping Details */}
        <View style={styles.shippingSection}>
          <View style={styles.shippingBox}>
            <Text style={styles.infoLabel}>Carrier</Text>
            <Text style={styles.infoValue}>{transfer.carrier || '-'}</Text>
          </View>
          <View style={styles.shippingBox}>
            <Text style={styles.infoLabel}>Method</Text>
            <Text style={styles.infoValue}>{methodLabel}</Text>
          </View>
          <View style={styles.shippingBox}>
            <Text style={styles.infoLabel}>Departure</Text>
            <Text style={styles.infoValue}>{formatDate(transfer.scheduledDepartureDate)}</Text>
          </View>
          <View style={styles.shippingBox}>
            <Text style={styles.infoLabel}>Arrival</Text>
            <Text style={styles.infoValue}>{formatDate(transfer.scheduledArrivalDate)}</Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colSku]}>SKU</Text>
            <Text style={[styles.tableHeaderCell, styles.colProduct]}>Product</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnitCost]}>Unit Cost</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>
          {transfer.lineItems.map((item, index) => (
            <View key={item.id} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, styles.tableCellBold, styles.colSku]}>{item.sku}</Text>
              <Text style={[styles.tableCell, styles.colProduct]}>{item.productName}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{item.quantity.toLocaleString()}</Text>
              <Text style={[styles.tableCell, styles.colUnitCost]}>{formatCurrency(item.unitCost)}</Text>
              <Text style={[styles.tableCell, styles.tableCellBold, styles.colTotal]}>{formatCurrency(item.totalCost)}</Text>
            </View>
          ))}
        </View>

        {/* Summary Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 10, color: '#78716c' }}>
              Total Items: {transfer.lineItems.length} | Total Units: {transfer.totalUnits.toLocaleString()}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1c1917' }}>
              Goods Value: {formatCurrency(transfer.totalValue)}
            </Text>
          </View>
        </View>

        {/* Costs Breakdown */}
        {totalCosts > 0 && (
          <View style={styles.costsSection}>
            <View style={styles.costsBox}>
              {transfer.costs.freight > 0 && (
                <View style={styles.costsRow}>
                  <Text style={styles.costsLabel}>Freight</Text>
                  <Text style={styles.costsValue}>{formatCurrency(transfer.costs.freight)}</Text>
                </View>
              )}
              {transfer.costs.insurance > 0 && (
                <View style={styles.costsRow}>
                  <Text style={styles.costsLabel}>Insurance</Text>
                  <Text style={styles.costsValue}>{formatCurrency(transfer.costs.insurance)}</Text>
                </View>
              )}
              {transfer.costs.duties > 0 && (
                <View style={styles.costsRow}>
                  <Text style={styles.costsLabel}>Duties</Text>
                  <Text style={styles.costsValue}>{formatCurrency(transfer.costs.duties)}</Text>
                </View>
              )}
              {transfer.costs.taxes > 0 && (
                <View style={styles.costsRow}>
                  <Text style={styles.costsLabel}>Taxes</Text>
                  <Text style={styles.costsValue}>{formatCurrency(transfer.costs.taxes)}</Text>
                </View>
              )}
              {transfer.costs.handling > 0 && (
                <View style={styles.costsRow}>
                  <Text style={styles.costsLabel}>Handling</Text>
                  <Text style={styles.costsValue}>{formatCurrency(transfer.costs.handling)}</Text>
                </View>
              )}
              {transfer.costs.other > 0 && (
                <View style={styles.costsRow}>
                  <Text style={styles.costsLabel}>Other</Text>
                  <Text style={styles.costsValue}>{formatCurrency(transfer.costs.other)}</Text>
                </View>
              )}
              <View style={styles.costsTotalRow}>
                <Text style={styles.costsTotalLabel}>Total Shipping Cost</Text>
                <Text style={styles.costsTotalValue}>{formatCurrency(totalCosts)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Tracking Numbers */}
        {transfer.trackingNumbers.length > 0 && (
          <View style={styles.trackingSection}>
            <Text style={styles.trackingTitle}>Tracking Information</Text>
            {transfer.trackingNumbers.map((tracking, index) => (
              <View key={tracking.id || index} style={styles.trackingRow}>
                <Text style={styles.trackingLabel}>{tracking.carrier}:</Text>
                <Text style={styles.trackingValue}>{tracking.trackingNumber}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Customs Info */}
        {(transfer.customsInfo.hsCode || transfer.customsInfo.broker) && (
          <View style={styles.customsSection}>
            <Text style={styles.customsTitle}>Customs Information</Text>
            {transfer.customsInfo.hsCode && (
              <View style={styles.customsRow}>
                <Text style={styles.customsLabel}>HS Code:</Text>
                <Text style={styles.customsValue}>{transfer.customsInfo.hsCode}</Text>
              </View>
            )}
            {transfer.customsInfo.broker && (
              <View style={styles.customsRow}>
                <Text style={styles.customsLabel}>Customs Broker:</Text>
                <Text style={styles.customsValue}>{transfer.customsInfo.broker}</Text>
              </View>
            )}
            {transfer.customsInfo.entryNumber && (
              <View style={styles.customsRow}>
                <Text style={styles.customsLabel}>Entry Number:</Text>
                <Text style={styles.customsValue}>{transfer.customsInfo.entryNumber}</Text>
              </View>
            )}
            {transfer.incoterms && (
              <View style={styles.customsRow}>
                <Text style={styles.customsLabel}>Incoterms:</Text>
                <Text style={styles.customsValue}>{transfer.incoterms}</Text>
              </View>
            )}
          </View>
        )}

        {/* Notes */}
        {transfer.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{transfer.notes}</Text>
          </View>
        )}

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Shipped By (Signature & Date)</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Received By (Signature & Date)</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated on {formatDate(new Date().toISOString())}</Text>
          <Text style={styles.footerText}>{transfer.transferNumber}</Text>
        </View>
      </Page>
    </Document>
  )
}

// Utility function to generate PDF blob
export async function generateTransferManifestPDF(
  transfer: Transfer,
  transferStatuses: TransferStatusOption[],
  shippingMethods: ShippingMethodOption[],
  companyName?: string,
  companyAddress?: string
): Promise<Blob> {
  const doc = (
    <TransferManifestPDFDocument
      transfer={transfer}
      transferStatuses={transferStatuses}
      shippingMethods={shippingMethods}
      companyName={companyName}
      companyAddress={companyAddress}
    />
  )

  return await pdf(doc).toBlob()
}

// Utility function to download PDF
export async function downloadTransferManifestPDF(
  transfer: Transfer,
  transferStatuses: TransferStatusOption[],
  shippingMethods: ShippingMethodOption[],
  companyName?: string,
  companyAddress?: string
): Promise<void> {
  const blob = await generateTransferManifestPDF(
    transfer,
    transferStatuses,
    shippingMethods,
    companyName,
    companyAddress
  )
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `manifest-${transfer.transferNumber}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
