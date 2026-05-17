import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { ids, action } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }

    if (!action || !['Active', 'Paused', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'action must be Active, Paused, or delete' }, { status: 400 })
    }

    if (action === 'delete') {
      // Delete related records first
      await db.delivery.deleteMany({ where: { customerId: { in: ids } } })
      await db.payment.deleteMany({ where: { customerId: { in: ids } } })
      await db.lead.updateMany({ where: { convertedToId: { in: ids } }, data: { convertedToId: null } })
      await db.customer.deleteMany({ where: { id: { in: ids } } })
    } else {
      await db.customer.updateMany({
        where: { id: { in: ids } },
        data: { status: action },
      })
    }

    return NextResponse.json({ success: true, count: ids.length })
  } catch (error) {
    console.error('Bulk customer action error:', error)
    return NextResponse.json({ error: 'Failed to perform bulk action' }, { status: 500 })
  }
}
