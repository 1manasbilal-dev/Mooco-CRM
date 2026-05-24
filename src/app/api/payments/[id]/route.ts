import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { amount, date, method, status, notes, period } = body

    // Validate required fields if provided
    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
    }
    if (date !== undefined && !date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }
    if (method !== undefined && !method) {
      return NextResponse.json({ error: 'Method is required' }, { status: 400 })
    }
    if (status !== undefined && !['Completed', 'Pending', 'Failed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
    }
    if (method !== undefined && !['Cash', 'UPI', 'Bank Transfer', 'Cheque'].includes(method)) {
      return NextResponse.json({ error: 'Invalid method value' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (amount !== undefined) data.amount = amount
    if (date !== undefined) data.date = date
    if (method !== undefined) data.method = method
    if (status !== undefined) data.status = status
    if (notes !== undefined) data.notes = notes
    if (period !== undefined) data.period = period

    const payment = await db.payment.update({
      where: { id },
      data,
      include: { customer: { select: { name: true, area: true, phone: true } } },
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Payment PUT error:', error)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.payment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payment DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 })
  }
}
