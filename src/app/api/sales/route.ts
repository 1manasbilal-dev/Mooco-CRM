import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/sales?date=...&itemId=...&startDate=...&endDate=...&customerId=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const date = searchParams.get('date')
    const itemId = searchParams.get('itemId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const customerId = searchParams.get('customerId')

    const where: Record<string, unknown> = {}
    if (date) where.date = date
    if (itemId) where.itemId = itemId
    if (customerId) where.customerId = customerId
    if (startDate || endDate) {
      where.date = {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      }
    }

    // Default: if no filter specified, return today's sales
    if (!date && !itemId && !startDate && !endDate && !customerId) {
      where.date = new Date().toISOString().split('T')[0]
    }

    const sales = await db.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        item: { select: { name: true, category: true, unit: true, pricePerUnit: true } },
        ...(customerId ? { customer: { select: { name: true, phone: true } } } : {}),
      },
    })

    return NextResponse.json(sales)
  } catch (error) {
    console.error('Sales GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
  }
}

// POST /api/sales - Record a sale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId, quantity, date, notes, customerId } = body

    if (!itemId || !quantity || !date) {
      return NextResponse.json({ error: 'itemId, quantity, and date are required' }, { status: 400 })
    }

    // Fetch the inventory item to get pricePerUnit and name
    const item = await db.inventoryItem.findUnique({
      where: { id: itemId },
      select: { name: true, pricePerUnit: true },
    })

    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    const parsedQuantity = parseFloat(quantity)
    const calculatedAmount = parsedQuantity * item.pricePerUnit

    // If customerId is provided, fetch customer to determine route from their area
    let route = 'Route A'
    if (customerId) {
      const customer = await db.customer.findUnique({
        where: { id: customerId },
        select: { area: true },
      })
      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }
      // Map area to route letter like in generate API
      const areas = await db.area.findMany({ orderBy: { name: 'asc' } })
      const areaIndex = areas.findIndex(a => a.name === customer.area)
      if (areaIndex >= 0) {
        const routeLetter = String.fromCharCode(65 + (areaIndex % 26))
        route = `Route ${routeLetter}`
      }
    }

    // Create the sale
    const sale = await db.sale.create({
      data: {
        itemId,
        customerId: customerId || null,
        quantity: parsedQuantity,
        date,
        notes: notes || '',
        amount: calculatedAmount,
      },
      include: {
        item: { select: { name: true, category: true, unit: true, pricePerUnit: true } },
        customer: { select: { name: true, phone: true } },
      },
    })

    // If customerId is provided, also create a Delivery record
    if (customerId) {
      await db.delivery.create({
        data: {
          customerId,
          date,
          quantity: parsedQuantity,
          itemId,
          isExtra: true,
          pricePerUnit: item.pricePerUnit,
          productName: item.name,
          status: 'Delivered',
          route,
          notes: notes || '',
        },
      })
    }

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    console.error('Sales POST error:', error)
    return NextResponse.json({ error: 'Failed to record sale' }, { status: 500 })
  }
}
