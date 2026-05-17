import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { ids, action } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }

    if (!action || !['Active', 'Inactive', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'action must be Active, Inactive, or delete' }, { status: 400 })
    }

    if (action === 'delete') {
      // Delete related sales first
      await db.sale.deleteMany({ where: { itemId: { in: ids } } })
      await db.inventoryItem.deleteMany({ where: { id: { in: ids } } })
    } else {
      await db.inventoryItem.updateMany({
        where: { id: { in: ids } },
        data: { status: action },
      })
    }

    return NextResponse.json({ success: true, count: ids.length })
  } catch (error) {
    console.error('Bulk inventory action error:', error)
    return NextResponse.json({ error: 'Failed to perform bulk action' }, { status: 500 })
  }
}
