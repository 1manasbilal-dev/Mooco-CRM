import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date } = body

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'A valid date (YYYY-MM-DD) is required' },
        { status: 400 }
      )
    }

    // Fetch all active customers with their products
    const activeCustomers = await db.customer.findMany({
      where: { status: 'Active' },
      include: {
        products: {
          include: {
            item: true,
          },
        },
      },
    })

    if (activeCustomers.length === 0) {
      return NextResponse.json({
        message: 'No active customers found',
        created: 0,
        deliveries: [],
      })
    }

    // Fetch all areas to build a route mapping (area name -> route name)
    const areas = await db.area.findMany({ orderBy: { name: 'asc' } })
    // Assign route names based on area position: Route A, Route B, etc.
    const areaRouteMap: Record<string, string> = {}
    areas.forEach((area, index) => {
      const routeLetter = String.fromCharCode(65 + (index % 26)) // A, B, C, ...
      areaRouteMap[area.name] = `Route ${routeLetter}`
    })

    // Find all vacations that overlap with the target date
    const vacations = await db.vacation.findMany({
      where: {
        startDate: { lte: date },
        endDate: { gte: date },
      },
    })
    const vacationCustomerIds = new Set(vacations.map((v) => v.customerId))

    // Find existing deliveries for this date to avoid duplicates
    const existingDeliveries = await db.delivery.findMany({
      where: { date },
      select: { customerId: true, itemId: true },
    })
    // Build a set of "customerId::itemId" (itemId = "" for milk) for quick lookup
    const existingDeliveryKeys = new Set(
      existingDeliveries.map((d) => `${d.customerId}::${d.itemId ?? ''}`)
    )

    const newDeliveries: Array<{
      id: string
      customerId: string
      customerName: string
      date: string
      quantity: number
      productName: string
      route: string
      pricePerUnit: number
      itemId: string | null
    }> = []

    for (const customer of activeCustomers) {
      // Skip if customer is on vacation
      if (vacationCustomerIds.has(customer.id)) {
        continue
      }

      // Determine route from customer's area
      const route = areaRouteMap[customer.area] || 'Route A'

      // 1. Create milk delivery for the customer (if not already exists)
      const milkKey = `${customer.id}::`
      if (!existingDeliveryKeys.has(milkKey)) {
        const milkDelivery = await db.delivery.create({
          data: {
            customerId: customer.id,
            date,
            quantity: customer.dailyQty,
            status: 'Pending',
            route,
            itemId: null, // null = milk
            isExtra: false,
            pricePerUnit: customer.pricePerLiter,
            productName: 'Milk',
          },
          include: {
            customer: { select: { name: true } },
          },
        })

        newDeliveries.push({
          id: milkDelivery.id,
          customerId: milkDelivery.customerId,
          customerName: milkDelivery.customer.name,
          date: milkDelivery.date,
          quantity: milkDelivery.quantity,
          productName: milkDelivery.productName,
          route: milkDelivery.route,
          pricePerUnit: milkDelivery.pricePerUnit,
          itemId: milkDelivery.itemId,
        })

        existingDeliveryKeys.add(milkKey)
      }

      // 2. Create deliveries for each CustomerProduct
      for (const cp of customer.products) {
        const productKey = `${customer.id}::${cp.itemId}`
        if (!existingDeliveryKeys.has(productKey)) {
          const productDelivery = await db.delivery.create({
            data: {
              customerId: customer.id,
              date,
              quantity: cp.dailyQty,
              status: 'Pending',
              route,
              itemId: cp.itemId,
              isExtra: false,
              pricePerUnit: cp.item.pricePerUnit,
              productName: cp.item.name,
            },
            include: {
              customer: { select: { name: true } },
            },
          })

          newDeliveries.push({
            id: productDelivery.id,
            customerId: productDelivery.customerId,
            customerName: productDelivery.customer.name,
            date: productDelivery.date,
            quantity: productDelivery.quantity,
            productName: productDelivery.productName,
            route: productDelivery.route,
            pricePerUnit: productDelivery.pricePerUnit,
            itemId: productDelivery.itemId,
          })

          existingDeliveryKeys.add(productKey)
        }
      }
    }

    return NextResponse.json({
      message: `Generated ${newDeliveries.length} deliveries for ${date}`,
      created: newDeliveries.length,
      skippedVacation: vacationCustomerIds.size,
      deliveries: newDeliveries,
    })
  } catch (error) {
    console.error('Deliveries Generate POST error:', error)
    return NextResponse.json(
      { error: 'Failed to generate deliveries' },
      { status: 500 }
    )
  }
}
