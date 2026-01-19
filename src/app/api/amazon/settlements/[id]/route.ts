import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get settlement detail with transactions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const includeTransactions = searchParams.get('includeTransactions') !== 'false'
    const transactionType = searchParams.get('transactionType')
    const sku = searchParams.get('sku')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get settlement
    const { data: settlement, error: settlementError } = await supabase
      .from('amazon_settlements')
      .select('*')
      .eq('id', id)
      .single()

    if (settlementError || !settlement) {
      return NextResponse.json(
        { error: 'Settlement not found' },
        { status: 404 }
      )
    }

    // Get transactions if requested
    let transactions = null
    let transactionCount = 0

    if (includeTransactions) {
      let txnQuery = supabase
        .from('amazon_settlement_transactions')
        .select('*', { count: 'exact' })
        .eq('settlement_id', id)
        .order('posted_date', { ascending: false })
        .range(offset, offset + limit - 1)

      if (transactionType) {
        txnQuery = txnQuery.eq('transaction_type', transactionType)
      }
      if (sku) {
        txnQuery = txnQuery.eq('sku', sku)
      }

      const { data: txnData, error: txnError, count } = await txnQuery

      if (txnError) {
        console.error('Error fetching transactions:', txnError)
      } else {
        transactions = txnData
        transactionCount = count || 0
      }
    }

    // Get fee breakdown
    const { data: feeBreakdown } = await supabase
      .from('amazon_settlement_transactions')
      .select('amount_description, amount')
      .eq('settlement_id', id)
      .in('amount_type', ['ItemFees', 'FBAFees', 'Commission', 'Other'])

    // Aggregate fee breakdown
    const feesByType: Record<string, number> = {}
    for (const fee of feeBreakdown || []) {
      const key = fee.amount_description || 'Other'
      feesByType[key] = (feesByType[key] || 0) + (fee.amount || 0)
    }

    const feeBreakdownSorted = Object.entries(feesByType)
      .map(([type, amount]) => ({ type, amount }))
      .sort((a, b) => a.amount - b.amount) // Ascending (fees are negative)

    // Get SKU summary
    const { data: skuSummary } = await supabase
      .from('amazon_settlement_transactions')
      .select('sku, amount, transaction_type, amount_type')
      .eq('settlement_id', id)
      .not('sku', 'is', null)

    // Aggregate by SKU
    const skuData: Record<string, { sales: number; fees: number; refunds: number; net: number }> = {}
    for (const txn of skuSummary || []) {
      if (!txn.sku) continue

      if (!skuData[txn.sku]) {
        skuData[txn.sku] = { sales: 0, fees: 0, refunds: 0, net: 0 }
      }

      const amount = txn.amount || 0

      if (txn.transaction_type === 'Order' && txn.amount_type === 'ItemPrice') {
        skuData[txn.sku].sales += amount
      } else if (txn.transaction_type === 'Refund') {
        skuData[txn.sku].refunds += amount
      } else if (txn.amount_type?.includes('Fee') || txn.amount_type === 'Commission') {
        skuData[txn.sku].fees += amount
      }
      skuData[txn.sku].net += amount
    }

    const skuBreakdown = Object.entries(skuData)
      .map(([sku, data]) => ({ sku, ...data }))
      .sort((a, b) => b.net - a.net)

    return NextResponse.json({
      settlement,
      transactions,
      transactionCount,
      pagination: {
        limit,
        offset,
        total: transactionCount,
      },
      feeBreakdown: feeBreakdownSorted,
      skuBreakdown,
    })
  } catch (error) {
    console.error('Error fetching settlement detail:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settlement detail' },
      { status: 500 }
    )
  }
}

// DELETE - Delete settlement and its transactions
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Delete settlement (transactions will cascade delete)
    const { error } = await supabase
      .from('amazon_settlements')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting settlement:', error)
      return NextResponse.json(
        { error: 'Failed to delete settlement' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting settlement:', error)
    return NextResponse.json(
      { error: 'Failed to delete settlement' },
      { status: 500 }
    )
  }
}
