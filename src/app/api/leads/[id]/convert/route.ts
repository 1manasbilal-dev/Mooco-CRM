import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const lead = await db.lead.findUnique({ where: { id } })
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (lead.status === 'Converted') {
      return NextResponse.json({ error: 'Lead already converted' }, { status: 400 })
    }

    // Create customer from lead
    const customer = await db.customer.create({
      data: {
        name: lead.name,
        phone: lead.phone,
        area: lead.area,
        address: lead.address,
        dailyQty: lead.expectedQty || 1,
        status: 'Active',
        notes: `Converted from lead. Original notes: ${lead.notes}`,
      },
    })

    // Update lead status and link to customer
    await db.lead.update({
      where: { id },
      data: {
        status: 'Converted',
        convertedToId: customer.id,
      },
    })

    return NextResponse.json({ lead, customer }, { status: 201 })
  } catch (error) {
    console.error('Lead convert error:', error)
    return NextResponse.json({ error: 'Failed to convert lead' }, { status: 500 })
  }
}
