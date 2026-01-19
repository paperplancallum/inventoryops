'use client'

import { useState, useCallback, useRef } from 'react'
import { X, Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import type { AmazonFeeFormData, AmazonFeeType, FeeAttributionLevel, AmazonFee } from '@/lib/supabase/hooks'

const VALID_FEE_TYPES: AmazonFeeType[] = [
  'fba_fulfillment', 'fba_storage_monthly', 'fba_storage_long_term',
  'fba_removal', 'fba_disposal', 'fba_prep', 'fba_labeling',
  'inbound_placement', 'inbound_defect', 'inbound_transportation',
  'awd_storage', 'awd_processing', 'awd_transportation',
  'referral_fee', 'sponsored_products', 'sponsored_brands', 'sponsored_display',
  'reimbursement', 'refund_admin', 'other'
]

const VALID_ATTRIBUTION_LEVELS: FeeAttributionLevel[] = [
  'order_item', 'shipment', 'product', 'account'
]

interface ParsedRow {
  rowNumber: number
  data: AmazonFeeFormData
  errors: string[]
  isValid: boolean
}

interface AmazonFeesImportModalProps {
  onImport: (fees: AmazonFeeFormData[]) => Promise<AmazonFee[]>
  onCancel: () => void
}

export function AmazonFeesImportModal({ onImport, onCancel }: AmazonFeesImportModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseCSV = useCallback((text: string): ParsedRow[] => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
    const rows: ParsedRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      const errors: string[] = []

      // Map columns by header
      const getVal = (name: string): string => {
        const idx = headers.indexOf(name)
        return idx >= 0 && values[idx] ? values[idx].trim() : ''
      }

      // Parse fee_type
      const feeType = getVal('fee_type') as AmazonFeeType
      if (!feeType) {
        errors.push('Missing fee_type')
      } else if (!VALID_FEE_TYPES.includes(feeType)) {
        errors.push(`Invalid fee_type: ${feeType}`)
      }

      // Parse amount
      const amountStr = getVal('amount')
      const amount = parseFloat(amountStr)
      if (!amountStr || isNaN(amount)) {
        errors.push('Invalid amount')
      }

      // Parse fee_date
      const feeDate = getVal('fee_date')
      if (!feeDate || !/^\d{4}-\d{2}-\d{2}$/.test(feeDate)) {
        errors.push('Invalid fee_date (use YYYY-MM-DD)')
      }

      // Parse attribution_level
      const attributionLevel = (getVal('attribution_level') || 'account') as FeeAttributionLevel
      if (!VALID_ATTRIBUTION_LEVELS.includes(attributionLevel)) {
        errors.push(`Invalid attribution_level: ${attributionLevel}`)
      }

      // Parse include_in_cogs
      const includeInCogsStr = getVal('include_in_cogs')
      const includeInCogs = includeInCogsStr ? includeInCogsStr.toLowerCase() !== 'false' : true

      const data: AmazonFeeFormData = {
        feeType: feeType || 'other',
        amount: amount || 0,
        feeDate: feeDate || new Date().toISOString().split('T')[0],
        description: getVal('description') || undefined,
        attributionLevel,
        includeInCogs,
        source: 'csv_import',
        sourceReference: getVal('source_reference') || undefined,
        marketplace: getVal('marketplace') || undefined,
      }

      rows.push({
        rowNumber: i + 1,
        data,
        errors,
        isValid: errors.length === 0,
      })
    }

    return rows
  }, [])

  // Simple CSV line parser that handles quoted values
  const parseCSVLine = (line: string): string[] => {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current)
        current = ''
      } else {
        current += char
      }
    }
    values.push(current)
    return values
  }

  const handleFile = useCallback((file: File) => {
    setFile(file)
    setImportResult(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = parseCSV(text)
      setParsedRows(rows)
    }
    reader.readAsText(file)
  }, [parseCSV])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === 'text/csv') {
      handleFile(droppedFile)
    }
  }, [handleFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFile(selectedFile)
    }
  }, [handleFile])

  const handleImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid)
    if (validRows.length === 0) return

    setIsImporting(true)
    try {
      const result = await onImport(validRows.map(r => r.data))
      setImportResult({
        success: result.length,
        errors: validRows.length - result.length,
      })
    } finally {
      setIsImporting(false)
    }
  }

  const validCount = parsedRows.filter(r => r.isValid).length
  const invalidCount = parsedRows.filter(r => !r.isValid).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Import Amazon Fees
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Upload a CSV file with fee data
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Success Result */}
          {importResult && importResult.success > 0 && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Import Complete
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Successfully imported {importResult.success} fees
                    {importResult.errors > 0 && ` (${importResult.errors} failed)`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Drop Zone */}
          {!file && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500'
              }`}
            >
              <Upload className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
              <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Drop your CSV file here
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                Select CSV File
              </button>
            </div>
          )}

          {/* File Selected */}
          {file && (
            <>
              {/* File Info */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-6">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{file.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {parsedRows.length} rows parsed
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null)
                    setParsedRows([])
                    setImportResult(null)
                  }}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Change file
                </button>
              </div>

              {/* Validation Summary */}
              {parsedRows.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{validCount}</p>
                    <p className="text-sm text-green-700 dark:text-green-300">Valid rows</p>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{invalidCount}</p>
                    <p className="text-sm text-red-700 dark:text-red-300">Invalid rows</p>
                  </div>
                </div>
              )}

              {/* Error Details */}
              {invalidCount > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Errors to fix:
                  </h3>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {parsedRows.filter(r => !r.isValid).slice(0, 10).map(row => (
                      <div key={row.rowNumber} className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-red-700 dark:text-red-300">Row {row.rowNumber}:</span>
                          <span className="text-red-600 dark:text-red-400 ml-1">{row.errors.join(', ')}</span>
                        </div>
                      </div>
                    ))}
                    {invalidCount > 10 && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                        ...and {invalidCount - 10} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Preview */}
              {validCount > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Preview (first 5 valid rows):
                  </h3>
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Type</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Amount</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {parsedRows.filter(r => r.isValid).slice(0, 5).map(row => (
                          <tr key={row.rowNumber}>
                            <td className="px-3 py-2 text-slate-900 dark:text-white">{row.data.feeType}</td>
                            <td className="px-3 py-2 text-slate-900 dark:text-white">${row.data.amount.toFixed(2)}</td>
                            <td className="px-3 py-2 text-slate-900 dark:text-white">{row.data.feeDate}</td>
                            <td className="px-3 py-2 text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                              {row.data.description || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CSV Format Help */}
              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Expected CSV format:</h4>
                <code className="block text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-pre overflow-x-auto">
{`fee_type,amount,fee_date,description,attribution_level,include_in_cogs
fba_fulfillment,2.50,2026-01-15,Order fulfillment,order_item,true
fba_storage_monthly,15.00,2026-01-01,January storage,account,true`}
                </code>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            {importResult?.success ? 'Close' : 'Cancel'}
          </button>
          {!importResult?.success && (
            <button
              onClick={handleImport}
              disabled={isImporting || validCount === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import {validCount} Fees
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
