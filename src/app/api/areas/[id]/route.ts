import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Area name is required' }, { status: 400 })
    }

    const area = await db.area.update({
      where: { id },
      data: { name: name.trim() },
    })
    return NextResponse.json(area)
  } catch (error) {
    console.error('Area PUT error:', error)
    return NextResponse.json({ error: 'Failed to update area' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.area.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Area DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete area' }, { status: 500 })
  }
}
