'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer'
import type { PurchaseOrder, POStatusOption } from './types'

// Styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#4f46e5',
    paddingBottom: 20,
  },
  companySection: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#64748b',
    lineHeight: 1.4,
  },
  poSection: {
    alignItems: 'flex-end',
  },
  poTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  poNumber: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  infoSection: {
    flexDirection: 'row',
    marginBottom: 25,
    gap: 20,
  },
  infoBox: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  infoLabel: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  infoValueSmall: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.4,
    marginTop: 2,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4f46e5',
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
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 9,
    color: '#334155',
  },
  colSku: { width: '15%' },
  colProduct: { width: '35%' },
  colQty: { width: '12%', textAlign: 'right' },
  colUnitCost: { width: '18%', textAlign: 'right' },
  colSubtotal: { width: '20%', textAlign: 'right' },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  totalsBox: {
    width: 200,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    padding: 15,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  totalsLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  totalsValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  totalsFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 5,
    borderTopWidth: 2,
    borderTopColor: '#4f46e5',
  },
  totalsFinalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  totalsFinalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  notesSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fffbeb',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#78350f',
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
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  termsSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0fdf4',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  termsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 5,
  },
  termsText: {
    fontSize: 9,
    color: '#15803d',
    lineHeight: 1.5,
  },
})

interface POPDFProps {
  purchaseOrder: PurchaseOrder
  poStatuses: POStatusOption[]
  companyName?: string
  companyAddress?: string
  companyEmail?: string
}

// PDF Document component
export function POPDFDocument({
  purchaseOrder,
  poStatuses,
  companyName = 'Your Company',
  companyAddress = '123 Business St, City, Country',
  companyEmail = 'orders@yourcompany.com',
}: POPDFProps) {
  const formatDate = (dateStr: string) => {
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

  const statusLabel = poStatuses.find(s => s.id === purchaseOrder.status)?.label || purchaseOrder.status

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companySection}>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companyDetails}>
              {companyAddress}
              {'\n'}{companyEmail}
            </Text>
          </View>
          <View style={styles.poSection}>
            <Text style={styles.poTitle}>PURCHASE ORDER</Text>
            <Text style={styles.poNumber}>{purchaseOrder.poNumber}</Text>
            <View style={styles.statusBadge}>
              <Text>{statusLabel}</Text>
            </View>
          </View>
        </View>

        {/* Info Boxes */}
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Supplier</Text>
            <Text style={styles.infoValue}>{purchaseOrder.supplierName}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Order Date</Text>
            <Text style={styles.infoValue}>{formatDate(purchaseOrder.orderDate)}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Expected Date</Text>
            <Text style={styles.infoValue}>{formatDate(purchaseOrder.expectedDate)}</Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colSku]}>SKU</Text>
            <Text style={[styles.tableHeaderCell, styles.colProduct]}>Product</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnitCost]}>Unit Cost</Text>
            <Text style={[styles.tableHeaderCell, styles.colSubtotal]}>Subtotal</Text>
          </View>
          {purchaseOrder.lineItems.map((item, index) => (
            <View key={item.id} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, styles.colSku]}>{item.sku}</Text>
              <Text style={[styles.tableCell, styles.colProduct]}>{item.productName}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{item.quantity.toLocaleString()}</Text>
              <Text style={[styles.tableCell, styles.colUnitCost]}>{formatCurrency(item.unitCost)}</Text>
              <Text style={[styles.tableCell, styles.colSubtotal]}>{formatCurrency(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{formatCurrency(purchaseOrder.subtotal)}</Text>
            </View>
            <View style={styles.totalsFinalRow}>
              <Text style={styles.totalsFinalLabel}>Total</Text>
              <Text style={styles.totalsFinalValue}>{formatCurrency(purchaseOrder.total)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Terms */}
        {purchaseOrder.paymentTerms && (
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Payment Terms</Text>
            <Text style={styles.termsText}>{purchaseOrder.paymentTerms}</Text>
          </View>
        )}

        {/* Notes */}
        {purchaseOrder.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{purchaseOrder.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated on {formatDate(new Date().toISOString())}</Text>
          <Text style={styles.footerText}>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  )
}

// Utility function to generate PDF blob
export async function generatePOPDF(
  purchaseOrder: PurchaseOrder,
  poStatuses: POStatusOption[],
  companyName?: string,
  companyAddress?: string,
  companyEmail?: string
): Promise<Blob> {
  const doc = (
    <POPDFDocument
      purchaseOrder={purchaseOrder}
      poStatuses={poStatuses}
      companyName={companyName}
      companyAddress={companyAddress}
      companyEmail={companyEmail}
    />
  )

  return await pdf(doc).toBlob()
}

// Utility function to download PDF
export async function downloadPOPDF(
  purchaseOrder: PurchaseOrder,
  poStatuses: POStatusOption[],
  companyName?: string,
  companyAddress?: string,
  companyEmail?: string
): Promise<void> {
  const blob = await generatePOPDF(purchaseOrder, poStatuses, companyName, companyAddress, companyEmail)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${purchaseOrder.poNumber}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
