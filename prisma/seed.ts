import { db } from '../src/lib/db'

const AREAS = ['Gulshan-e-Iqbal', 'DHA Phase 5', 'Clifton Block 2', 'Bahadurabad', 'PECHS', 'North Nazimabad', 'Saddar', 'Defence View', 'Kharadar', 'Liaquatabad']
const MILK_TYPES = ['Full Cream', 'Toned', 'Double Toned', 'Skimmed', 'Buffalo']
const ROUTES = ['Route A - Gulshan', 'Route B - DHA', 'Route C - Clifton', 'Route D - PECHS', 'Route E - North Nazimabad']
const STATUSES = ['New', 'Contacted', 'Trial', 'Converted', 'Lost']
const SOURCES = ['Walk-in', 'Phone', 'Referral', 'Online', 'Ad']
const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque']
const CATEGORIES = ['Milk', 'Yogurt', 'Butter', 'Cream', 'Eggs', 'Paneer', 'Other']

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10
}

function getDateStr(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

async function seed() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await db.payment.deleteMany()
  await db.delivery.deleteMany()
  await db.customer.deleteMany()
  await db.lead.deleteMany()
  await db.inventoryItem.deleteMany()
  await db.shopSetting.deleteMany()
  await db.dailySummary.deleteMany()

  // Shop settings
  const settings = [
    { key: 'shopName', value: 'DairyFlow Fresh Milk Shop' },
    { key: 'shopPhone', value: '+92 300 1234567' },
    { key: 'shopAddress', value: 'Shop #12, Block 3, Gulshan-e-Iqbal, Karachi' },
    { key: 'shopEmail', value: 'info@dairyflow.pk' },
    { key: 'deliveryCharge', value: '0' },
    { key: 'morningCutoff', value: '07:00 AM' },
    { key: 'eveningCutoff', value: '06:00 PM' },
    { key: 'businessHours', value: '6:00 AM - 10:00 PM' },
    { key: 'defaultMilkPrice', value: '60' },
    { key: 'currency', value: 'PKR' },
  ]
  for (const s of settings) {
    await db.shopSetting.create({ data: s })
  }

  // Inventory items
  const inventoryItems = [
    { name: 'Full Cream Milk', category: 'Milk', unit: 'liters', openingStock: 500, purchasedStock: 200, soldStock: 450, currentStock: 250, minStock: 50, pricePerUnit: 60, expiryDate: getDateStr(2) },
    { name: 'Toned Milk', category: 'Milk', unit: 'liters', openingStock: 300, purchasedStock: 100, soldStock: 280, currentStock: 120, minStock: 40, pricePerUnit: 55, expiryDate: getDateStr(2) },
    { name: 'Buffalo Milk', category: 'Milk', unit: 'liters', openingStock: 200, purchasedStock: 80, soldStock: 190, currentStock: 90, minStock: 30, pricePerUnit: 80, expiryDate: getDateStr(2) },
    { name: 'Skimmed Milk', category: 'Milk', unit: 'liters', openingStock: 150, purchasedStock: 50, soldStock: 120, currentStock: 80, minStock: 25, pricePerUnit: 50, expiryDate: getDateStr(2) },
    { name: 'Plain Yogurt', category: 'Yogurt', unit: 'kg', openingStock: 100, purchasedStock: 40, soldStock: 95, currentStock: 45, minStock: 20, pricePerUnit: 120, expiryDate: getDateStr(3) },
    { name: 'Fruit Yogurt', category: 'Yogurt', unit: 'kg', openingStock: 50, purchasedStock: 20, soldStock: 45, currentStock: 25, minStock: 10, pricePerUnit: 180, expiryDate: getDateStr(3) },
    { name: 'Butter (Salted)', category: 'Butter', unit: 'kg', openingStock: 40, purchasedStock: 15, soldStock: 30, currentStock: 25, minStock: 8, pricePerUnit: 450, expiryDate: getDateStr(7) },
    { name: 'Butter (Unsalted)', category: 'Butter', unit: 'kg', openingStock: 30, purchasedStock: 10, soldStock: 25, currentStock: 15, minStock: 5, pricePerUnit: 480, expiryDate: getDateStr(7) },
    { name: 'Fresh Cream', category: 'Cream', unit: 'liters', openingStock: 50, purchasedStock: 20, soldStock: 40, currentStock: 30, minStock: 10, pricePerUnit: 250, expiryDate: getDateStr(4) },
    { name: 'Farm Eggs', category: 'Eggs', unit: 'dozen', openingStock: 200, purchasedStock: 80, soldStock: 180, currentStock: 100, minStock: 30, pricePerUnit: 280, expiryDate: getDateStr(10) },
    { name: 'Paneer', category: 'Paneer', unit: 'kg', openingStock: 30, purchasedStock: 10, soldStock: 28, currentStock: 12, minStock: 5, pricePerUnit: 550, expiryDate: getDateStr(3) },
    { name: 'Khoya', category: 'Other', unit: 'kg', openingStock: 20, purchasedStock: 8, soldStock: 18, currentStock: 10, minStock: 3, pricePerUnit: 700, expiryDate: getDateStr(2) },
    { name: 'Lassi', category: 'Other', unit: 'liters', openingStock: 60, purchasedStock: 25, soldStock: 55, currentStock: 30, minStock: 10, pricePerUnit: 100, expiryDate: getDateStr(1) },
  ]
  for (const item of inventoryItems) {
    await db.inventoryItem.create({ data: item })
  }

  // Leads
  const leadsData = [
    { name: 'Farhan Ali', phone: '03001234567', area: 'Gulshan-e-Iqbal', address: 'House 12, Block 13', expectedQty: 2, status: 'New', notes: 'Interested in buffalo milk', source: 'Phone' },
    { name: 'Sana Khan', phone: '03119876543', area: 'DHA Phase 5', address: 'Flat 4B, Sea View Towers', expectedQty: 1.5, status: 'Contacted', notes: 'Wants trial for 3 days', source: 'Online' },
    { name: 'Imran Sheikh', phone: '03215678901', area: 'Clifton Block 2', address: 'Villa 7, 12th Street', expectedQty: 3, status: 'Trial', notes: 'Trial started Monday', source: 'Referral' },
    { name: 'Ayesha Mahmood', phone: '03334567890', area: 'Bahadurabad', address: 'Apt 5, Al-Rahman Center', expectedQty: 1, status: 'Converted', notes: 'Converted to customer', source: 'Walk-in' },
    { name: 'Bilal Raza', phone: '03451234567', area: 'PECHS', address: 'House 45, Block 6', expectedQty: 2, status: 'Lost', notes: 'Went with competitor', source: 'Ad' },
    { name: 'Nadia Hussain', phone: '03567890123', area: 'North Nazimabad', address: 'Block H, House 22', expectedQty: 1, status: 'New', notes: 'Saw our ad on Facebook', source: 'Online' },
    { name: 'Tariq Anwar', phone: '03678901234', area: 'Saddar', address: 'Shop 3, Zaibunnisa Street', expectedQty: 5, status: 'Contacted', notes: 'Needs bulk delivery for restaurant', source: 'Walk-in' },
    { name: 'Meher Javed', phone: '03789012345', area: 'Defence View', address: 'Flat 8, Creek Vista', expectedQty: 2, status: 'Trial', notes: 'Wants both morning and evening', source: 'Referral' },
    { name: 'Kamran Siddiqui', phone: '03890123456', area: 'Kharadar', address: 'Memon Masjid Road, Shop 9', expectedQty: 3, status: 'New', notes: 'Looking for daily 3L', source: 'Phone' },
    { name: 'Rubina Akhtar', phone: '03901234567', area: 'Liaquatabad', address: 'C-1 Area, House 78', expectedQty: 1.5, status: 'Lost', notes: 'Price too high', source: 'Ad' },
    { name: 'Omer Farooq', phone: '03023456789', area: 'Gulshan-e-Iqbal', address: 'Block 14, Flat 3', expectedQty: 2, status: 'New', notes: '', source: 'Walk-in' },
    { name: 'Samina Beg', phone: '03133456789', area: 'DHA Phase 5', address: 'Street 8, House 33', expectedQty: 1, status: 'Contacted', notes: 'Wants skimmed milk', source: 'Phone' },
  ]
  const createdLeads: any[] = []
  for (const l of leadsData) {
    const lead = await db.lead.create({ data: l })
    createdLeads.push(lead)
  }

  // Customers
  const customersData = [
    { name: 'Ahmed Raza', phone: '03011112222', area: 'Gulshan-e-Iqbal', address: 'House 5, Block 13', dailyQty: 2, milkType: 'Full Cream', pricePerLiter: 60, status: 'Active', deliveryTime: 'Morning', notes: 'Regular customer for 2 years' },
    { name: 'Fatima Noor', phone: '03112223333', area: 'DHA Phase 5', address: 'Villa 12, 26th Street', dailyQty: 3, milkType: 'Buffalo', pricePerLiter: 80, status: 'Active', deliveryTime: 'Both', notes: 'Prefers extra thick milk' },
    { name: 'Hassan Ali', phone: '03223334444', area: 'Clifton Block 2', address: 'Flat 7A, Ocean Towers', dailyQty: 1, milkType: 'Toned', pricePerLiter: 55, status: 'Active', deliveryTime: 'Morning', notes: '' },
    { name: 'Zainab Khan', phone: '03334445555', area: 'Bahadurabad', address: 'House 22, Shaheed-e-Millat Road', dailyQty: 1.5, milkType: 'Full Cream', pricePerLiter: 60, status: 'Active', deliveryTime: 'Evening', notes: 'Monthly payment' },
    { name: 'Usman Sheikh', phone: '03445556666', area: 'PECHS', address: 'Block 3, Tariq Road', dailyQty: 2, milkType: 'Buffalo', pricePerLiter: 80, status: 'Active', deliveryTime: 'Morning', notes: 'Restaurant owner - bulk order' },
    { name: 'Amina Bibi', phone: '03556667777', area: 'North Nazimabad', address: 'Block H, House 45', dailyQty: 1, milkType: 'Double Toned', pricePerLiter: 50, status: 'Paused', deliveryTime: 'Morning', notes: 'Paused - traveling for 2 weeks' },
    { name: 'Rashid Ahmed', phone: '03667778888', area: 'Saddar', address: 'Shop 7, Regal Chowk', dailyQty: 5, milkType: 'Full Cream', pricePerLiter: 55, status: 'Active', deliveryTime: 'Both', notes: 'Tea shop - bulk buyer' },
    { name: 'Sadia Parveen', phone: '03778889999', area: 'Defence View', address: 'Creek Vista, Flat 12', dailyQty: 2, milkType: 'Skimmed', pricePerLiter: 50, status: 'Active', deliveryTime: 'Morning', notes: '' },
    { name: 'Naveed Iqbal', phone: '03889990000', area: 'Kharadar', address: 'M.A. Jinnah Road, House 88', dailyQty: 3, milkType: 'Full Cream', pricePerLiter: 60, status: 'Active', deliveryTime: 'Evening', notes: 'Always pays on time' },
    { name: 'Kulsoom Fatima', phone: '03990001111', area: 'Liaquatabad', address: 'C-1 Area, House 33', dailyQty: 1.5, milkType: 'Buffalo', pricePerLiter: 80, status: 'Active', deliveryTime: 'Morning', notes: 'Also orders yogurt weekly' },
    { name: 'Waqar Hassan', phone: '03021223344', area: 'Gulshan-e-Iqbal', address: 'Block 15, Flat 6', dailyQty: 1, milkType: 'Toned', pricePerLiter: 55, status: 'Active', deliveryTime: 'Morning', notes: '' },
    { name: 'Shahida Waqas', phone: '03132234455', area: 'DHA Phase 5', address: 'Phase 5, 30th Street, House 8', dailyQty: 2, milkType: 'Full Cream', pricePerLiter: 60, status: 'Active', deliveryTime: 'Both', notes: 'Regular for 1 year' },
    { name: 'Junaid Malik', phone: '03243345566', area: 'Clifton Block 2', address: 'Block 2, 10th Street', dailyQty: 4, milkType: 'Buffalo', pricePerLiter: 75, status: 'Active', deliveryTime: 'Morning', notes: 'Catering business' },
    { name: 'Tahira Begum', phone: '03354456677', area: 'PECHS', address: 'Block 6, House 15', dailyQty: 1, milkType: 'Full Cream', pricePerLiter: 60, status: 'Active', deliveryTime: 'Morning', notes: '' },
    { name: 'Asim Javed', phone: '03465567788', area: 'Bahadurabad', address: '12th Commercial Street', dailyQty: 2, milkType: 'Skimmed', pricePerLiter: 50, status: 'Paused', deliveryTime: 'Evening', notes: 'Paused - health reasons' },
    { name: 'Nargis Sultan', phone: '03576678899', area: 'North Nazimabad', address: 'Block A, House 67', dailyQty: 1.5, milkType: 'Toned', pricePerLiter: 55, status: 'Active', deliveryTime: 'Morning', notes: 'Pays via bank transfer' },
    { name: 'Irfan Siddiqui', phone: '03687789900', area: 'Saddar', address: 'Abdullah Haroon Road', dailyQty: 6, milkType: 'Full Cream', pricePerLiter: 55, status: 'Active', deliveryTime: 'Both', notes: 'Hotel owner - major client' },
    { name: 'Parveen Akhtar', phone: '03798890011', area: 'Defence View', address: 'Beach Avenue, House 5', dailyQty: 1, milkType: 'Buffalo', pricePerLiter: 80, status: 'Active', deliveryTime: 'Morning', notes: '' },
    { name: 'Shoaib Raza', phone: '03809901122', area: 'Liaquatabad', address: 'D-1 Area, Flat 9', dailyQty: 2, milkType: 'Full Cream', pricePerLiter: 60, status: 'Active', deliveryTime: 'Evening', notes: 'Sometimes orders extra on weekends' },
    { name: 'Bushra Naz', phone: '03010012233', area: 'Kharadar', address: 'Jodia Bazaar, Shop 12', dailyQty: 3, milkType: 'Buffalo', pricePerLiter: 75, status: 'Active', deliveryTime: 'Morning', notes: 'Sweet shop owner' },
  ]
  const createdCustomers: any[] = []
  for (const c of customersData) {
    const monthlyBill = Math.round(c.dailyQty * c.pricePerLiter * 30)
    const customer = await db.customer.create({ data: { ...c, monthlyBill } })
    createdCustomers.push(customer)
  }

  // Deliveries - create for last 30 days
  const today = new Date().toISOString().split('T')[0]
  for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
    const date = getDateStr(daysAgo)
    for (const customer of createdCustomers) {
      if (customer.status === 'Paused' && daysAgo < 15) continue
      if (customer.status === 'Paused' && Math.random() > 0.3) continue
      
      const isDelivered = daysAgo > 0 ? Math.random() > 0.08 : Math.random() > 0.3
      const isMissed = !isDelivered && Math.random() > 0.5
      const status = daysAgo === 0 
        ? (Math.random() > 0.4 ? 'Delivered' : 'Pending')
        : isDelivered ? 'Delivered' : isMissed ? 'Missed' : 'Cancelled'
      
      const routeIndex = AREAS.indexOf(customer.area)
      const route = routeIndex >= 0 && routeIndex < ROUTES.length ? ROUTES[routeIndex] : ROUTES[0]
      
      await db.delivery.create({
        data: {
          customerId: customer.id,
          date,
          quantity: customer.dailyQty,
          status,
          route,
          notes: status === 'Missed' ? 'Customer not available' : status === 'Cancelled' ? 'Customer cancelled' : '',
        }
      })
    }
  }

  // Payments - create for last 3 months
  for (const customer of createdCustomers) {
    const monthlyBill = customer.monthlyBill
    for (let monthAgo = 0; monthAgo < 3; monthAgo++) {
      const date = getDateStr(monthAgo * 30 + Math.floor(Math.random() * 10))
      const period = (() => {
        const d = new Date()
        d.setMonth(d.getMonth() - monthAgo)
        return d.toISOString().slice(0, 7)
      })()
      
      const isPaid = monthAgo > 0 ? Math.random() > 0.15 : Math.random() > 0.5
      const amount = Math.round(monthlyBill * (0.8 + Math.random() * 0.4))
      
      await db.payment.create({
        data: {
          customerId: customer.id,
          amount,
          date,
          status: isPaid ? 'Completed' : 'Pending',
          method: randomItem(PAYMENT_METHODS),
          invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          period,
          notes: isPaid ? '' : 'Pending payment',
        }
      })
    }
  }

  // Daily summaries for last 30 days
  for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
    const date = getDateStr(daysAgo)
    const totalDeliveries = Math.floor(12 + Math.random() * 8)
    const totalMilkSold = Math.round((40 + Math.random() * 30) * 10) / 10
    const totalRevenue = Math.round(totalMilkSold * 60 * (0.9 + Math.random() * 0.2))
    const newCustomers = Math.floor(Math.random() * 3)
    
    await db.dailySummary.create({
      data: { date, totalDeliveries, totalMilkSold, totalRevenue, newCustomers }
    })
  }

  console.log('✅ Database seeded successfully!')
  console.log(`  - ${createdLeads.length} leads`)
  console.log(`  - ${createdCustomers.length} customers`)
  console.log(`  - Deliveries for 30 days`)
  console.log(`  - Payments for 3 months`)
  console.log(`  - ${inventoryItems.length} inventory items`)
  console.log(`  - ${settings.length} shop settings`)
  console.log(`  - 30 daily summaries`)
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
