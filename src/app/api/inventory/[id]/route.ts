import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const item = await db.inventoryItem.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Inventory PUT error:', error)
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.inventoryItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Inventory DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 })
  }
}
