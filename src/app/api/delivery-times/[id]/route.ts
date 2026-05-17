import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Delivery time name is required' }, { status: 400 })
    }

    const deliveryTime = await db.deliveryTime.update({
      where: { id },
      data: { name: name.trim() },
    })
    return NextResponse.json(deliveryTime)
  } catch (error) {
    console.error('DeliveryTime PUT error:', error)
    return NextResponse.json({ error: 'Failed to update delivery time' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.deliveryTime.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DeliveryTime DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete delivery time' }, { status: 500 })
  }
}
