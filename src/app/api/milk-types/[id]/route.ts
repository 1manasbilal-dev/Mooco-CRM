import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, pricePerLiter } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Milk type name is required' }, { status: 400 })
    }

    const milkType = await db.milkType.update({
      where: { id },
      data: {
        name: name.trim(),
        ...(pricePerLiter !== undefined ? { pricePerLiter } : {}),
      },
    })
    return NextResponse.json(milkType)
  } catch (error) {
    console.error('MilkType PUT error:', error)
    return NextResponse.json({ error: 'Failed to update milk type' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.milkType.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('MilkType DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete milk type' }, { status: 500 })
  }
}
