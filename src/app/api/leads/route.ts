import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const area = searchParams.get('area')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (area) where.area = area

    const leads = await db.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error('Leads GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, area, address, expectedQty, status, notes, source } = body

    if (!name || !phone || !area) {
      return NextResponse.json({ error: 'Name, phone, and area are required' }, { status: 400 })
    }

    const lead = await db.lead.create({
      data: {
        name,
        phone,
        area,
        address: address || '',
        expectedQty: expectedQty || 0,
        status: status || 'New',
        notes: notes || '',
        source: source || 'Walk-in',
      },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    console.error('Leads POST error:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}
