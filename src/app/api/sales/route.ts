import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/sales?date=...&itemId=...&startDate=...&endDate=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const date = searchParams.get('date')
    const itemId = searchParams.get('itemId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = {}
    if (date) where.date = date
    if (itemId) where.itemId = itemId
    if (startDate || endDate) {
      where.date = {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      }
    }

    // Default: if no filter specified, return today's sales
    if (!date && !itemId && !startDate && !endDate) {
      where.date = new Date().toISOString().split('T')[0]
    }

    const sales = await db.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { item: { select: { name: true, category: true, unit: true, pricePerUnit: true } } },
    })

    return NextResponse.json(sales)
  } catch (error) {
    console.error('Sales GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
  }
}

// POST /api/sales - Record a sale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId, quantity, date, notes } = body

    if (!itemId || !quantity || !date) {
      return NextResponse.json({ error: 'itemId, quantity, and date are required' }, { status: 400 })
    }

    const sale = await db.sale.create({
      data: {
        itemId,
        quantity: parseFloat(quantity),
        date,
        notes: notes || '',
      },
      include: { item: { select: { name: true, category: true, unit: true, pricePerUnit: true } } },
    })

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    console.error('Sales POST error:', error)
    return NextResponse.json({ error: 'Failed to record sale' }, { status: 500 })
  }
}
