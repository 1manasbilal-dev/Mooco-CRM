import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const area = searchParams.get('area')
    const milkType = searchParams.get('milkType')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (area) where.area = area
    if (milkType) where.milkType = milkType
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { area: { contains: search } },
      ]
    }

    const customers = await db.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { deliveries: true, payments: true } },
      },
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Customers GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, area, address, dailyQty, milkType, pricePerLiter, status, deliveryTime, notes } = body

    if (!name || !phone || !area) {
      return NextResponse.json({ error: 'Name, phone, and area are required' }, { status: 400 })
    }

    const customer = await db.customer.create({
      data: {
        name,
        phone,
        area,
        address: address || '',
        dailyQty: dailyQty ?? 1,
        milkType: milkType || 'Full Cream',
        pricePerLiter: pricePerLiter ?? 60,
        status: status || 'Active',
        deliveryTime: deliveryTime || 'Morning',
        notes: notes || '',
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Customers POST error:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}
