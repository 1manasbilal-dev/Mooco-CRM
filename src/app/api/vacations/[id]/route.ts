import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const vacation = await db.vacation.findUnique({ where: { id } })
    if (!vacation) {
      return NextResponse.json({ error: 'Vacation not found' }, { status: 404 })
    }

    await db.vacation.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Vacation DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete vacation' }, { status: 500 })
  }
}
