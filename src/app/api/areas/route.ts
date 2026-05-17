import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
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
