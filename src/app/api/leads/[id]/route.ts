import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const lead = await db.lead.findUnique({
      where: { id },
      include: { customer: true },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Lead GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const lead = await db.lead.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Lead PUT error:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.lead.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Lead DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }
}
