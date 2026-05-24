import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get('customerId')
    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 })
    }

    const products = await db.customerProduct.findMany({
      where: { customerId },
      include: { item: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('CustomerProducts GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch customer products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, itemId, dailyQty } = body

    if (!customerId || !itemId || !dailyQty) {
      return NextResponse.json(
        { error: 'customerId, itemId, and dailyQty are required' },
        { status: 400 }
      )
    }

    // Check if product already added for this customer
    const existing = await db.customerProduct.findUnique({
      where: { customerId_itemId: { customerId, itemId } },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'This product is already added for this customer' },
        { status: 409 }
      )
    }

    // Verify item exists
    const item = await db.inventoryItem.findUnique({ where: { id: itemId } })
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const product = await db.customerProduct.create({
      data: {
        customerId,
        itemId,
        dailyQty: parseFloat(String(dailyQty)),
      },
      include: { item: true },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('CustomerProduct POST error:', error)
    return NextResponse.json({ error: 'Failed to add product' }, { status: 500 })
  }
}
