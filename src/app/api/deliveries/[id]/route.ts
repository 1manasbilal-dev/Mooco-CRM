import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const delivery = await db.delivery.update({
      where: { id },
      data: body,
      include: { customer: { select: { name: true } } },
    })

    return NextResponse.json(delivery)
  } catch (error) {
    console.error('Delivery PUT error:', error)
    return NextResponse.json({ error: 'Failed to update delivery' }, { status: 500 })
  }
}
