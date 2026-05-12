import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]

    const deliveries = await db.delivery.findMany({
      where: { date: today },
      include: { customer: { select: { name: true, area: true, phone: true } } },
    })

    const total = deliveries.length
    const delivered = deliveries.filter((d) => d.status === 'Delivered').length
    const pending = deliveries.filter((d) => d.status === 'Pending').length
    const missed = deliveries.filter((d) => d.status === 'Missed').length

    return NextResponse.json({
      date: today,
      total,
      delivered,
      pending,
      missed,
      deliveries,
    })
  } catch (error) {
    console.error('Deliveries today error:', error)
    return NextResponse.json({ error: 'Failed to fetch today\'s deliveries' }, { status: 500 })
  }
}
