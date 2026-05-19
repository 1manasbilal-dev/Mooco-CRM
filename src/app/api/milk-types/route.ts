import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const milkTypes = await db.milkType.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(milkTypes)
  } catch (error) {
    console.error('MilkTypes GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch milk types' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, pricePerLiter } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Milk type name is required' }, { status: 400 })
    }

    const existing = await db.milkType.findUnique({ where: { name: name.trim() } })
    if (existing) {
      return NextResponse.json({ error: 'Milk type already exists' }, { status: 409 })
    }

    const milkType = await db.milkType.create({
      data: {
        name: name.trim(),
        pricePerLiter: pricePerLiter ?? 60,
      },
    })
    return NextResponse.json(milkType, { status: 201 })
  } catch (error) {
    console.error('MilkTypes POST error:', error)
    return NextResponse.json({ error: 'Failed to create milk type' }, { status: 500 })
  }
}
