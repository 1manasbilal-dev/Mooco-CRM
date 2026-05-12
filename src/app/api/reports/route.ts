import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // ── Monthly Revenue (last 12 months from DailySummary) ────────────────
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    const twelveMonthsAgoStr = twelveMonthsAgo.toISOString().split('T')[0]

    const dailySummaries = await db.dailySummary.findMany({
      where: { date: { gte: twelveMonthsAgoStr } },
      orderBy: { date: 'asc' },
    })

    // Aggregate daily summaries into monthly buckets
    const monthlyMap: Record<string, { revenue: number; orders: number; milkSold: number; deliveries: number }> = {}
    for (const s of dailySummaries) {
      const month = s.date.substring(0, 7) // "2025-01"
      if (!monthlyMap[month]) {
        monthlyMap[month] = { revenue: 0, orders: 0, milkSold: 0, deliveries: 0 }
      }
      monthlyMap[month].revenue += s.totalRevenue
      monthlyMap[month].orders += s.totalDeliveries
      monthlyMap[month].milkSold += s.totalMilkSold
      monthlyMap[month].deliveries += s.totalDeliveries
    }

    // Generate all 12 months even if no data
    const monthlyRevenue: Array<{ month: string; revenue: number; orders: number }> = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const entry = monthlyMap[key] || { revenue: 0, orders: 0, milkSold: 0, deliveries: 0 }
      monthlyRevenue.push({ month: key, revenue: entry.revenue, orders: entry.orders })
    }

    // ── Milk Sold by Type (from deliveries joined with customer milkType) ─
    const deliveries = await db.delivery.findMany({
      where: { date: { gte: twelveMonthsAgoStr } },
      include: { customer: { select: { milkType: true } } },
    })

    const milkMap: Record<string, { fullCream: number; toned: number; buffalo: number; skimmed: number; doubleToned: number }> = {}
    for (const d of deliveries) {
      const month = d.date.substring(0, 7)
      if (!milkMap[month]) {
        milkMap[month] = { fullCream: 0, toned: 0, buffalo: 0, skimmed: 0, doubleToned: 0 }
      }
      const type = d.customer.milkType
      if (type === 'Full Cream') milkMap[month].fullCream += d.quantity
      else if (type === 'Toned') milkMap[month].toned += d.quantity
      else if (type === 'Buffalo') milkMap[month].buffalo += d.quantity
      else if (type === 'Skimmed') milkMap[month].skimmed += d.quantity
      else if (type === 'Double Toned') milkMap[month].doubleToned += d.quantity
      else milkMap[month].fullCream += d.quantity // default
    }

    const milkSold: Array<{ month: string; fullCream: number; toned: number; buffalo: number; skimmed: number; doubleToned: number }> = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      milkSold.push({
        month: key,
        ...(milkMap[key] || { fullCream: 0, toned: 0, buffalo: 0, skimmed: 0, doubleToned: 0 }),
      })
    }

    // ── Customer Stats (new vs lost per month) ────────────────────────────
    const allCustomers = await db.customer.findMany({
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    })

    const customerStatsMap: Record<string, { newCustomers: number; lostCustomers: number }> = {}
    for (const c of allCustomers) {
      const month = c.createdAt.toISOString().substring(0, 7)
      if (!customerStatsMap[month]) {
        customerStatsMap[month] = { newCustomers: 0, lostCustomers: 0 }
      }
      customerStatsMap[month].newCustomers++
    }

    // Paused customers count as "lost" in the month they paused (approximation: use updatedAt)
    const pausedCustomers = await db.customer.findMany({
      where: { status: 'Paused' },
      select: { updatedAt: true },
    })
    for (const c of pausedCustomers) {
      const month = c.updatedAt.toISOString().substring(0, 7)
      if (!customerStatsMap[month]) {
        customerStatsMap[month] = { newCustomers: 0, lostCustomers: 0 }
      }
      customerStatsMap[month].lostCustomers++
    }

    // Count active customers at each month end
    const activeCount = await db.customer.count({ where: { status: 'Active' } })

    const customerStats: Array<{ month: string; newCustomers: number; lostCustomers: number; totalActive: number }> = []
    let runningTotal = activeCount
    // Work backwards from current month
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const entry = customerStatsMap[key] || { newCustomers: 0, lostCustomers: 0 }
      customerStats.unshift({
        month: key,
        newCustomers: entry.newCustomers,
        lostCustomers: entry.lostCustomers,
        totalActive: runningTotal,
      })
    }

    // ── Area Performance ──────────────────────────────────────────────────
    const customersWithArea = await db.customer.findMany({
      select: { area: true, dailyQty: true, pricePerLiter: true, status: true },
    })

    const areaMap: Record<string, { customers: number; revenue: number; deliveries: number }> = {}
    for (const c of customersWithArea) {
      if (!areaMap[c.area]) {
        areaMap[c.area] = { customers: 0, revenue: 0, deliveries: 0 }
      }
      areaMap[c.area].customers++
      if (c.status === 'Active') {
        areaMap[c.area].revenue += c.dailyQty * c.pricePerLiter * 30
        areaMap[c.area].deliveries += 30 // approx 1 delivery/day for 30 days
      }
    }

    const areaPerformance = Object.entries(areaMap).map(([area, data]) => ({
      area,
      customers: data.customers,
      revenue: Math.round(data.revenue),
      deliveries: data.deliveries,
    })).sort((a, b) => b.revenue - a.revenue)

    // ── Top Customers ─────────────────────────────────────────────────────
    const topCustomersRaw = await db.customer.findMany({
      where: { status: 'Active' },
      select: { id: true, name: true, monthlyBill: true, status: true },
      orderBy: { monthlyBill: 'desc' },
      take: 5,
    })
    const topCustomers = topCustomersRaw.map((c) => ({
      id: c.id,
      name: c.name,
      monthlyBill: Math.round(c.monthlyBill),
      status: c.status,
    }))

    // ── Pending Dues ──────────────────────────────────────────────────────
    const pendingPayments = await db.payment.findMany({
      where: { status: 'Pending' },
      include: { customer: { select: { name: true } } },
    })

    // Aggregate by customer
    const duesMap: Record<string, { customerName: string; pendingAmount: number }> = {}
    for (const p of pendingPayments) {
      if (!duesMap[p.customerId]) {
        duesMap[p.customerId] = { customerName: p.customer.name, pendingAmount: 0 }
      }
      duesMap[p.customerId].pendingAmount += p.amount
    }

    const pendingDues = Object.entries(duesMap).map(([customerId, data]) => ({
      customerId,
      customerName: data.customerName,
      pendingAmount: Math.round(data.pendingAmount),
    })).sort((a, b) => b.pendingAmount - a.pendingAmount)

    // ── Growth Summary ────────────────────────────────────────────────────
    // Compare last 2 months from monthly revenue
    const thisMonth = monthlyMap[currentMonth]
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`
    const lastMonth = monthlyMap[lastMonthKey]

    const safeGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    const growthSummary = {
      revenueGrowth: safeGrowth(thisMonth?.revenue || 0, lastMonth?.revenue || 0),
      customerGrowth: safeGrowth(
        customerStats[customerStats.length - 1]?.newCustomers || 0,
        customerStats[customerStats.length - 2]?.newCustomers || 0
      ),
      milkGrowth: safeGrowth(thisMonth?.milkSold || 0, lastMonth?.milkSold || 0),
      deliveryGrowth: safeGrowth(thisMonth?.deliveries || 0, lastMonth?.deliveries || 0),
    }

    return NextResponse.json({
      monthlyRevenue,
      milkSold,
      customerStats,
      areaPerformance,
      topCustomers,
      pendingDues,
      growthSummary,
    })
  } catch (error) {
    console.error('Reports GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
