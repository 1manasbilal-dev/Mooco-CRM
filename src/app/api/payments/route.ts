import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const method = searchParams.get('method')
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (method) where.method = method
    if (customerId) where.customerId = customerId
    if (startDate || endDate) {
      where.date = {}
      if (startDate) (where.date as Record<string, unknown>).gte = startDate
      if (endDate) (where.date as Record<string, unknown>).lte = endDate
    }

    const payments = await db.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true, area: true, phone: true } } },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Payments GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, amount, date, status, method, invoiceNumber, period, notes } = body

    if (!customerId || !amount || !date) {
      return NextResponse.json({ error: 'customerId, amount, and date are required' }, { status: 400 })
    }

    const payment = await db.payment.create({
      data: {
        customerId,
        amount,
        date,
        status: status || 'Completed',
        method: method || 'Cash',
        invoiceNumber: invoiceNumber || '',
        period: period || '',
        notes: notes || '',
      },
      include: { customer: { select: { name: true } } },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Payments POST error:', error)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }
}
