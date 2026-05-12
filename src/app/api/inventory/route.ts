import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const items = await db.inventoryItem.findMany({
      orderBy: { name: 'asc' },
    })

    const itemsWithStatus = items.map((item) => ({
      ...item,
      stockStatus: item.currentStock <= 0
        ? 'Out of Stock'
        : item.currentStock < item.minStock
          ? 'Low Stock'
          : 'In Stock',
    }))

    return NextResponse.json(itemsWithStatus)
  } catch (error) {
    console.error('Inventory GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      category,
      unit,
      openingStock,
      purchasedStock,
      soldStock,
      currentStock,
      minStock,
      pricePerUnit,
      expiryDate,
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const item = await db.inventoryItem.create({
      data: {
        name,
        category: category || 'Milk',
        unit: unit || 'liters',
        openingStock: openingStock ?? 0,
        purchasedStock: purchasedStock ?? 0,
        soldStock: soldStock ?? 0,
        currentStock: currentStock ?? 0,
        minStock: minStock ?? 5,
        pricePerUnit: pricePerUnit ?? 0,
        expiryDate: expiryDate || null,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Inventory POST error:', error)
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 })
  }
}
