import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_CATEGORIES = ['Milk', 'Yogurt', 'Butter', 'Cream', 'Eggs', 'Paneer', 'Other']

export async function GET() {
  try {
    // Auto-seed default categories if none exist
    const count = await db.category.count()
    if (count === 0) {
      await db.category.createMany({
        data: DEFAULT_CATEGORIES.map((name) => ({ name })),
      })
    }

    const categories = await db.category.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const existing = await db.category.findUnique({ where: { name: name.trim() } })
    if (existing) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 })
    }

    const category = await db.category.create({ data: { name: name.trim() } })
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Categories POST error:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
