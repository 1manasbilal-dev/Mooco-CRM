import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_AREAS = ['Main Market', 'Colony Area', 'Defence', 'Gulshan', 'Sadar']

export async function GET() {
  try {
    // Auto-seed default areas if none exist
    const count = await db.area.count()
    if (count === 0) {
      await db.area.createMany({
        data: DEFAULT_AREAS.map((name) => ({ name })),
      })
    }

    const areas = await db.area.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(areas)
  } catch (error) {
    console.error('Areas GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch areas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Area name is required' }, { status: 400 })
    }

    const existing = await db.area.findUnique({ where: { name: name.trim() } })
    if (existing) {
      return NextResponse.json({ error: 'Area already exists' }, { status: 409 })
    }

    const area = await db.area.create({ data: { name: name.trim() } })
    return NextResponse.json(area, { status: 201 })
  } catch (error) {
    console.error('Areas POST error:', error)
    return NextResponse.json({ error: 'Failed to create area' }, { status: 500 })
  }
}
