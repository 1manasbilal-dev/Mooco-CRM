import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Total due (pending payments)
    const pendingPayments = await db.payment.findMany({
      where: { status: 'Pending' },
      include: { customer: { select: { name: true, phone: true, area: true } } },
    })

    const totalDue = pendingPayments.reduce((sum, p) => sum + p.amount, 0)

    // Total received (completed payments)
    const completedPayments = await db.payment.findMany({
      where: { status: 'Completed' },
    })
    const totalReceived = completedPayments.reduce((sum, p) => sum + p.amount, 0)

    // Pending count
    const pendingCount = pendingPayments.length

    // Customer-wise dues
    const customerDues: Record<string, { customerName: string; customerPhone: string; totalDue: number }> = {}
    pendingPayments.forEach((p) => {
      const key = p.customerId
      if (!customerDues[key]) {
        customerDues[key] = {
          customerName: p.customer.name,
          customerPhone: p.customer.phone,
          totalDue: 0,
        }
      }
      customerDues[key].totalDue += p.amount
    })

    return NextResponse.json({
      totalDue,
      totalReceived,
      pendingCount,
      customerDues: Object.entries(customerDues).map(([customerId, data]) => ({
        customerId,
        ...data,
      })),
    })
  } catch (error) {
    console.error('Payment summary error:', error)
    return NextResponse.json({ error: 'Failed to fetch payment summary' }, { status: 500 })
  }
}
