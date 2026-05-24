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
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    // Check for duplicate name (excluding current category)
    const existing = await db.category.findUnique({ where: { name: name.trim() } })
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 409 })
    }

    const category = await db.category.update({
      where: { id },
      data: { name: name.trim() },
    })
    return NextResponse.json(category)
  } catch (error) {
    console.error('Category PUT error:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Category DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
