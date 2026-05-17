import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Default seed data for re-seeding after reset
const DEFAULT_AREAS = [
  'Gulshan-e-Iqbal',
  'DHA Phase 5',
  'Clifton Block 2',
  'Bahadurabad',
  'PECHS',
  'North Nazimabad',
  'Saddar',
  'Defence View',
  'Kharadar',
  'Liaquatabad',
]

const DEFAULT_MILK_TYPES = [
  { name: 'Full Cream', pricePerLiter: 60 },
  { name: 'Toned', pricePerLiter: 55 },
  { name: 'Double Toned', pricePerLiter: 45 },
  { name: 'Skimmed', pricePerLiter: 50 },
  { name: 'Buffalo', pricePerLiter: 80 },
]

const DEFAULT_DELIVERY_TIMES = ['Morning', 'Evening', 'Both']

export async function POST() {
  try {
    // Delete all data in correct order (respecting foreign keys)
    await db.sale.deleteMany()
    await db.delivery.deleteMany()
    await db.payment.deleteMany()
    await db.lead.updateMany({ data: { convertedToId: null } })
    await db.customer.deleteMany()
    await db.lead.deleteMany()
    await db.inventoryItem.deleteMany()
    await db.shopSetting.deleteMany()
    await db.dailySummary.deleteMany()
    await db.area.deleteMany()
    await db.milkType.deleteMany()
    await db.deliveryTime.deleteMany()

    // Re-seed default areas, milk types, and delivery times
    // so the app still works after reset
    for (const name of DEFAULT_AREAS) {
      await db.area.create({ data: { name } })
    }
    for (const mt of DEFAULT_MILK_TYPES) {
      await db.milkType.create({ data: mt })
    }
    for (const name of DEFAULT_DELIVERY_TIMES) {
      await db.deliveryTime.create({ data: { name } })
    }

    return NextResponse.json({ success: true, message: 'All data has been reset and defaults re-seeded' })
  } catch (error) {
    console.error('Reset error:', error)
    return NextResponse.json({ error: 'Failed to reset data' }, { status: 500 })
  }
}
