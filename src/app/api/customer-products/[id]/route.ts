import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { dailyQty } = body

    if (dailyQty === undefined || dailyQty === null) {
      return NextResponse.json({ error: 'dailyQty is required' }, { status: 400 })
    }

    const product = await db.customerProduct.update({
      where: { id },
      data: { dailyQty: parseFloat(String(dailyQty)) },
      include: { item: true },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('CustomerProduct PUT error:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await db.customerProduct.findUnique({ where: { id } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    await db.customerProduct.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('CustomerProduct DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
