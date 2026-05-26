import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const route = searchParams.get('route')
    const customerId = searchParams.get('customerId')

    const where: Record<string, unknown> = {}
    if (date) where.date = date
    if (status) where.status = status
    if (route) where.route = route
    if (customerId) where.customerId = customerId

    const deliveries = await db.delivery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true, area: true, phone: true, milkType: true } } },
    })

    return NextResponse.json(deliveries)
  } catch (error) {
    console.error('Deliveries GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch deliveries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, date, quantity, status, notes, route, itemId, isExtra, pricePerUnit, productName } = body

    if (!customerId || !date || quantity === undefined) {
      return NextResponse.json({ error: 'customerId, date, and quantity are required' }, { status: 400 })
    }

    const delivery = await db.delivery.create({
      data: {
        customerId,
        date,
        quantity,
        status: status || 'Pending',
        notes: notes || '',
        route: route || 'Route A',
        itemId: itemId ?? null,
        isExtra: isExtra ?? false,
        pricePerUnit: pricePerUnit ?? 0,
        productName: productName || 'Milk',
      },
      include: { customer: { select: { name: true, area: true, phone: true, milkType: true } } },
    })

    return NextResponse.json(delivery, { status: 201 })
  } catch (error) {
    console.error('Deliveries POST error:', error)
    return NextResponse.json({ error: 'Failed to create delivery' }, { status: 500 })
  }
}
