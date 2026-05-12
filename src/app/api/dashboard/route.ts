import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

    // Active customers count
    const totalActiveCustomers = await db.customer.count({
      where: { status: 'Active' },
    })

    // New leads today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const newLeadsToday = await db.lead.count({
      where: { createdAt: { gte: todayStart } },
    })

    // Milk delivered today
    const deliveredToday = await db.delivery.findMany({
      where: { date: today, status: 'Delivered' },
    })
    const milkDeliveredToday = deliveredToday.reduce((sum, d) => sum + d.quantity, 0)

    // Revenue today from DailySummary
    const dailySummary = await db.dailySummary.findUnique({
      where: { date: today },
    })
    const revenueToday = dailySummary?.totalRevenue ?? 0

    // Pending payments
    const pendingPaymentsData = await db.payment.findMany({
      where: { status: 'Pending' },
    })
    const pendingPayments = pendingPaymentsData.reduce((sum, p) => sum + p.amount, 0)

    // Monthly sales trend (last 30 days)
    const monthlySalesTrend = await db.dailySummary.findMany({
      where: { date: { gte: thirtyDaysAgoStr } },
      orderBy: { date: 'asc' },
    })

    // Customer growth (group by creation month)
    const customers = await db.customer.findMany({
      select: { createdAt: true },
    })
    const customerGrowth: Record<string, number> = {}
    customers.forEach((c) => {
      const month = c.createdAt.toISOString().slice(0, 7)
      customerGrowth[month] = (customerGrowth[month] || 0) + 1
    })

    // Recent deliveries
    const recentDeliveries = await db.delivery.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true } } },
    })

    // Recent payments
    const recentPayments = await db.payment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true } } },
    })

    // Low stock items (Prisma doesn't support field comparison, filter in JS)
    const allInventory = await db.inventoryItem.findMany()
    const lowStock = allInventory.filter((item) => item.currentStock < item.minStock)

    return NextResponse.json({
      totalActiveCustomers,
      newLeadsToday,
      milkDeliveredToday,
      revenueToday,
      pendingPayments,
      monthlySalesTrend,
      customerGrowth: Object.entries(customerGrowth).map(([month, count]) => ({ month, count })),
      recentDeliveries,
      recentPayments,
      lowStockItems: lowStock,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
