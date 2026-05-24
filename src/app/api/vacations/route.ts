import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get('customerId')
    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 })
    }

    const vacations = await db.vacation.findMany({
      where: { customerId },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json(vacations)
  } catch (error) {
    console.error('Vacations GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch vacations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, startDate, endDate, notes } = body

    if (!customerId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'customerId, startDate, and endDate are required' },
        { status: 400 }
      )
    }

    // Validate date range
    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Check for overlapping vacations
    const overlapping = await db.vacation.findFirst({
      where: {
        customerId,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    })

    if (overlapping) {
      return NextResponse.json(
        { error: 'This vacation overlaps with an existing one' },
        { status: 409 }
      )
    }

    const vacation = await db.vacation.create({
      data: {
        customerId,
        startDate,
        endDate,
        notes: notes || '',
      },
    })

    return NextResponse.json(vacation, { status: 201 })
  } catch (error) {
    console.error('Vacation POST error:', error)
    return NextResponse.json({ error: 'Failed to create vacation' }, { status: 500 })
  }
}
