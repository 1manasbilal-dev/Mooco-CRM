import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const deliveryTimes = await db.deliveryTime.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(deliveryTimes)
  } catch (error) {
    console.error('DeliveryTimes GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch delivery times' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Delivery time name is required' }, { status: 400 })
    }

    const existing = await db.deliveryTime.findUnique({ where: { name: name.trim() } })
    if (existing) {
      return NextResponse.json({ error: 'Delivery time already exists' }, { status: 409 })
    }

    const deliveryTime = await db.deliveryTime.create({ data: { name: name.trim() } })
    return NextResponse.json(deliveryTime, { status: 201 })
  } catch (error) {
    console.error('DeliveryTimes POST error:', error)
    return NextResponse.json({ error: 'Failed to create delivery time' }, { status: 500 })
  }
}
