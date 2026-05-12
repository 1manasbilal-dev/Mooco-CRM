import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const payment = await db.payment.update({
      where: { id },
      data: body,
      include: { customer: { select: { name: true } } },
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Payment PUT error:', error)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}
