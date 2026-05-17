import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const category = searchParams.get('category')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (date || startDate || endDate) {
      // Fetch items with their sales for the date range
      const items = await db.inventoryItem.findMany({
        orderBy: { name: 'asc' },
        include: {
          sales: {
            where: {
              ...(date ? { date } : {}),
              ...((startDate || endDate) ? {
                date: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                }
              } : {}),
            }
          },
        },
      })

      const itemsWithSales = items.map((item) => {
        const totalSold = item.sales.reduce((sum, s) => sum + s.quantity, 0)
        const totalRevenue = totalSold * item.pricePerUnit
        return {
          ...item,
          totalSold,
          totalRevenue,
          salesCount: item.sales.length,
        }
      })

      return NextResponse.json(itemsWithSales)
    }

    // Default: fetch items with today's sales
    const today = new Date().toISOString().split('T')[0]
    const items = await db.inventoryItem.findMany({
      orderBy: { name: 'asc' },
      include: {
        sales: {
          where: { date: today },
        },
      },
    })

    const itemsWithSales = items.map((item) => {
      const todaySold = item.sales.reduce((sum, s) => sum + s.quantity, 0)
      const todayRevenue = todaySold * item.pricePerUnit
      return {
        ...item,
        todaySold,
        todayRevenue,
        salesCount: item.sales.length,
      }
    })

    return NextResponse.json(itemsWithSales)
  } catch (error) {
    console.error('Inventory GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, unit, pricePerUnit } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const item = await db.inventoryItem.create({
      data: {
        name,
        category: category || 'Milk',
        unit: unit || 'liters',
        pricePerUnit: pricePerUnit ?? 0,
        status: 'Active',
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Inventory POST error:', error)
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 })
  }
}
