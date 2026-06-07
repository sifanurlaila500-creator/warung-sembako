import { db } from './db'

const INITIAL_BUYERS = [
  "Aikbal", "Adani", "M Jamang", "M Daday", "M Idad", "B Rama", "M Deden",
  "Om Gozin", "M Tupi", "B Wawan", "M Jae", "M Aris", "M Jop", "M Rudi",
  "Fadil", "M Gojlag", "Dayat", "M Gareng", "Yuda", "M Andi", "M Asi"
]

// ==================== BUYERS ====================

export async function getBuyers() {
  const buyers = await db.buyer.findMany({ orderBy: { createdAt: 'asc' } })
  return buyers.map((b) => ({
    id: b.id,
    name: b.name,
    phone: b.phone || '',
    address: b.address || '',
    createdAt: b.createdAt.toISOString(),
  }))
}

export async function createBuyer(input: { name: string; phone?: string; address?: string }) {
  const buyer = await db.buyer.create({
    data: {
      name: input.name,
      phone: input.phone || '',
      address: input.address || '',
    },
  })
  return {
    id: buyer.id,
    name: buyer.name,
    phone: buyer.phone || '',
    address: buyer.address || '',
    createdAt: buyer.createdAt.toISOString(),
    totalDebt: 0,
  }
}

export async function updateBuyer(id: string, input: { name: string; phone?: string; address?: string }) {
  const buyer = await db.buyer.update({
    where: { id },
    data: {
      name: input.name,
      phone: input.phone || '',
      address: input.address || '',
    },
  })
  return {
    id: buyer.id,
    name: buyer.name,
    phone: buyer.phone || '',
    address: buyer.address || '',
    createdAt: buyer.createdAt.toISOString(),
  }
}

export async function deleteBuyer(id: string) {
  // Cascade delete will handle related records
  await db.buyer.delete({ where: { id } })
  return { success: true }
}

// ==================== PRODUCTS ====================

export async function getProducts() {
  const products = await db.product.findMany({ orderBy: { createdAt: 'asc' } })
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    unit: p.unit || 'pcs',
    buyPrice: p.buyPrice,
    sellPrice: p.sellPrice,
    stock: p.stock,
    createdAt: p.createdAt.toISOString(),
  }))
}

export async function createProduct(input: { name: string; unit: string; buyPrice: number; sellPrice: number; stock: number }) {
  const product = await db.product.create({
    data: {
      name: input.name,
      unit: input.unit,
      buyPrice: input.buyPrice,
      sellPrice: input.sellPrice,
      stock: input.stock,
    },
  })
  return {
    id: product.id,
    name: product.name,
    unit: product.unit || 'pcs',
    buyPrice: product.buyPrice,
    sellPrice: product.sellPrice,
    stock: product.stock,
    createdAt: product.createdAt.toISOString(),
  }
}

export async function updateProduct(id: string, input: { name: string; unit: string; buyPrice: number; sellPrice: number; stock: number }) {
  const product = await db.product.update({
    where: { id },
    data: {
      name: input.name,
      unit: input.unit,
      buyPrice: input.buyPrice,
      sellPrice: input.sellPrice,
      stock: input.stock,
    },
  })
  return {
    id: product.id,
    name: product.name,
    unit: product.unit || 'pcs',
    buyPrice: product.buyPrice,
    sellPrice: product.sellPrice,
    stock: product.stock,
    createdAt: product.createdAt.toISOString(),
  }
}

export async function deleteProduct(id: string) {
  // Delete transaction items referencing this product first
  await db.transactionItem.deleteMany({ where: { productId: id } })
  await db.product.delete({ where: { id } })
  return { success: true }
}

// ==================== TRANSACTIONS ====================

export async function getTransactions() {
  const transactions = await db.transaction.findMany({
    orderBy: { date: 'desc' },
    include: { items: { include: { product: true } }, buyer: true },
  })
  return transactions.map((t) => ({
    id: t.id,
    buyerId: t.buyerId,
    date: t.date.toISOString(),
    totalAmount: t.totalAmount,
    paidAmount: t.paidAmount,
    type: t.type,
    status: t.status,
    notes: t.notes || '',
    items: (t.items || []).map((i) => ({
      productId: i.productId || '',
      productName: i.product?.name || '',
      quantity: i.quantity,
      buyPrice: i.buyPrice,
      sellPrice: i.sellPrice,
      subtotal: i.subtotal,
    })),
    createdAt: t.createdAt.toISOString(),
    buyer: t.buyer ? { name: t.buyer.name } : { name: 'Unknown' },
  }))
}

export async function createTransaction(input: {
  buyerId: string; type: string; paidAmount: number; notes: string; date: string
  items: { productId: string; productName: string; quantity: number; buyPrice: number; sellPrice: number; subtotal: number }[]
  totalAmount: number
  totalOverride?: number
}) {
  // Validate buyer exists
  const buyer = await db.buyer.findUnique({ where: { id: input.buyerId } })
  if (!buyer) throw new Error('Pembeli tidak ditemukan')

  const paidAmount = input.type === 'CASH' ? input.totalAmount : input.paidAmount
  let status = 'PAID'
  if (input.type === 'CREDIT') {
    if (paidAmount <= 0) status = 'UNPAID'
    else if (paidAmount < input.totalAmount) status = 'PARTIAL'
  }

  const transaction = await db.transaction.create({
    data: {
      buyerId: input.buyerId,
      date: input.date ? new Date(input.date) : new Date(),
      totalAmount: input.totalAmount,
      paidAmount,
      type: input.type,
      status,
      notes: input.notes || '',
      items: {
        create: (input.items || []).map((item) => ({
          productId: item.productId || null,
          quantity: item.quantity,
          buyPrice: item.buyPrice,
          sellPrice: item.sellPrice,
          subtotal: item.subtotal,
        })),
      },
    },
    include: { items: true, buyer: true },
  })

  // Update stock for items with products
  for (const item of input.items || []) {
    if (!item.productId) continue
    const product = await db.product.findUnique({ where: { id: item.productId } })
    if (product) {
      const newStock = Math.max(0, product.stock - item.quantity)
      await db.product.update({ where: { id: item.productId }, data: { stock: newStock } })
    }
  }

  // Re-fetch with product includes for proper response
  const fullTransaction = await db.transaction.findUnique({
    where: { id: transaction.id },
    include: { items: { include: { product: true } }, buyer: true },
  })

  return {
    id: transaction.id,
    buyerId: transaction.buyerId,
    date: transaction.date.toISOString(),
    totalAmount: transaction.totalAmount,
    paidAmount: transaction.paidAmount,
    type: transaction.type,
    status: transaction.status,
    notes: transaction.notes || '',
    items: (fullTransaction?.items || []).map((i) => ({
      productId: i.productId || '',
      productName: i.product?.name || '',
      quantity: i.quantity,
      buyPrice: i.buyPrice,
      sellPrice: i.sellPrice,
      subtotal: i.subtotal,
    })),
    createdAt: transaction.createdAt.toISOString(),
    buyer: fullTransaction?.buyer ? { name: fullTransaction.buyer.name } : { name: 'Unknown' },
  }
}

export async function deleteTransaction(id: string) {
  // 1. Get items to restore stock
  const items = await db.transactionItem.findMany({ where: { transactionId: id } })
  for (const item of items) {
    if (!item.productId) continue
    const product = await db.product.findUnique({ where: { id: item.productId } })
    if (product) {
      const newStock = product.stock + item.quantity
      await db.product.update({ where: { id: item.productId }, data: { stock: newStock } })
    }
  }

  // 2. Delete the transaction (cascade will handle items)
  // But first delete payments referencing this transaction
  await db.payment.deleteMany({ where: { transactionId: id } })
  await db.transaction.delete({ where: { id } })
  return { success: true, message: 'Transaksi berhasil dihapus' }
}

// ==================== PAYMENTS ====================

export async function getPayments() {
  const payments = await db.payment.findMany({
    orderBy: { date: 'desc' },
    include: { buyer: true },
  })
  return payments.map((p) => ({
    id: p.id,
    buyerId: p.buyerId,
    transactionId: p.transactionId || '',
    amount: p.amount,
    date: p.date.toISOString(),
    notes: p.notes || '',
    createdAt: p.createdAt.toISOString(),
    buyer: p.buyer ? { name: p.buyer.name } : { name: 'Unknown' },
  }))
}

export async function createPayment(input: { buyerId: string; amount: number; date: string; notes: string }) {
  // Get unpaid transactions
  const unpaidTx = await db.transaction.findMany({
    where: {
      buyerId: input.buyerId,
      status: { in: ['UNPAID', 'PARTIAL'] },
    },
    orderBy: { date: 'asc' },
  })

  let remaining = input.amount
  let firstTxId: string | null = null

  for (const tx of unpaidTx) {
    if (remaining <= 0) break
    const owing = tx.totalAmount - tx.paidAmount
    if (owing <= 0) continue
    const payForThis = Math.min(remaining, owing)
    const newPaid = tx.paidAmount + payForThis
    let newStatus = 'PAID'
    if (newPaid <= 0) newStatus = 'UNPAID'
    else if (newPaid < tx.totalAmount) newStatus = 'PARTIAL'

    await db.transaction.update({
      where: { id: tx.id },
      data: { paidAmount: newPaid, status: newStatus },
    })
    if (!firstTxId) firstTxId = tx.id
    remaining -= payForThis
  }

  const payment = await db.payment.create({
    data: {
      buyerId: input.buyerId,
      transactionId: firstTxId,
      amount: input.amount,
      date: input.date ? new Date(input.date) : new Date(),
      notes: input.notes || '',
    },
    include: { buyer: true },
  })

  return {
    id: payment.id,
    buyerId: payment.buyerId,
    transactionId: payment.transactionId || '',
    amount: payment.amount,
    date: payment.date.toISOString(),
    notes: payment.notes || '',
    createdAt: payment.createdAt.toISOString(),
    buyer: payment.buyer ? { name: payment.buyer.name } : { name: 'Unknown' },
  }
}

export async function deletePayment(id: string) {
  // 1. Get payment info
  const payment = await db.payment.findUnique({ where: { id } })
  if (!payment) throw new Error('Pembayaran tidak ditemukan')

  const buyerId = payment.buyerId
  const payAmount = payment.amount

  // 2. Reverse the payment effect on transactions
  const buyerTx = await db.transaction.findMany({
    where: { buyerId, paidAmount: { gt: 0 } },
    orderBy: { date: 'desc' },
  })

  let remaining = payAmount
  for (const tx of buyerTx) {
    if (remaining <= 0) break
    const reduceBy = Math.min(remaining, tx.paidAmount)
    const newPaid = tx.paidAmount - reduceBy
    let newStatus = 'PAID'
    if (newPaid <= 0) newStatus = 'UNPAID'
    else if (newPaid < tx.totalAmount) newStatus = 'PARTIAL'

    await db.transaction.update({
      where: { id: tx.id },
      data: { paidAmount: newPaid, status: newStatus },
    })
    remaining -= reduceBy
  }

  // 3. Delete the payment
  await db.payment.delete({ where: { id } })
  return { success: true, message: 'Pembayaran berhasil dihapus' }
}

// ==================== DASHBOARD ====================

export async function getDashboardData() {
  const [buyers, transactions, payments, products] = await Promise.all([
    getBuyers(), getTransactions(), getPayments(), getProducts(),
  ])

  const totalSales = transactions.reduce((sum: number, t: any) => sum + t.totalAmount, 0)
  const totalPaid = transactions.reduce((sum: number, t: any) => sum + t.paidAmount, 0)
  const totalDebt = totalSales - totalPaid
  const totalCapital = transactions.reduce((sum: number, t: any) => sum + t.items.reduce((s: number, i: any) => s + i.buyPrice * i.quantity, 0), 0)
  const totalProfit = totalSales - totalCapital
  const remainingCapital = totalPaid - totalCapital

  const debtByBuyer = buyers.map((b: any) => {
    const buyerTx = transactions.filter((t: any) => t.buyerId === b.id && t.type === 'CREDIT' && t.status !== 'PAID')
    const debt = buyerTx.reduce((sum: number, t: any) => sum + (t.totalAmount - t.paidAmount), 0)
    return { id: b.id, name: b.name, phone: b.phone, totalDebt: debt }
  }).filter((b: any) => b.totalDebt > 0).sort((a: any, b: any) => b.totalDebt - a.totalDebt)

  const recentTransactions = [...transactions]
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return {
    totalSales, totalPaid, totalDebt, totalCapital, totalProfit, remainingCapital,
    activeDebtors: debtByBuyer.length, totalProducts: products.length, totalBuyers: buyers.length,
    debtByBuyer, recentTransactions,
  }
}

// ==================== REPORTS ====================

export async function getReportsData() {
  const [transactions, payments] = await Promise.all([getTransactions(), getPayments()])

  const totalSales = transactions.reduce((sum: number, t: any) => sum + t.totalAmount, 0)
  const totalPaid = transactions.reduce((sum: number, t: any) => sum + t.paidAmount, 0)
  const totalDebt = totalSales - totalPaid
  const totalCapital = transactions.reduce((sum: number, t: any) => sum + t.items.reduce((s: number, i: any) => s + i.buyPrice * i.quantity, 0), 0)
  const totalProfit = totalSales - totalCapital
  const cashSales = transactions.filter((t: any) => t.type === 'CASH').reduce((s: number, t: any) => s + t.totalAmount, 0)
  const creditSales = transactions.filter((t: any) => t.type === 'CREDIT').reduce((s: number, t: any) => s + t.totalAmount, 0)

  const monthlyData: Record<string, { sales: number; capital: number; profit: number; payments: number }> = {}
  for (const t of transactions) {
    const month = new Date(t.date).toISOString().slice(0, 7)
    if (!monthlyData[month]) monthlyData[month] = { sales: 0, capital: 0, profit: 0, payments: 0 }
    monthlyData[month].sales += t.totalAmount
    const capital = t.items.reduce((s: number, i: any) => s + i.buyPrice * i.quantity, 0)
    monthlyData[month].capital += capital
    monthlyData[month].profit += t.totalAmount - capital
  }
  for (const p of payments) {
    const month = new Date(p.date).toISOString().slice(0, 7)
    if (!monthlyData[month]) monthlyData[month] = { sales: 0, capital: 0, profit: 0, payments: 0 }
    monthlyData[month].payments += p.amount
  }

  const monthlyReport = Object.entries(monthlyData).map(([month, data]) => ({ month, ...data })).sort((a, b) => a.month.localeCompare(b.month))

  const buyers = await getBuyers()
  const debtByBuyer = buyers.map((b: any) => {
    const buyerTx = transactions.filter((t: any) => t.buyerId === b.id && t.type === 'CREDIT' && t.status !== 'PAID')
    const debt = buyerTx.reduce((sum: number, t: any) => sum + (t.totalAmount - t.paidAmount), 0)
    return { id: b.id, name: b.name, phone: b.phone, totalDebt: debt }
  }).filter((b: any) => b.totalDebt > 0).sort((a: any, b: any) => b.totalDebt - a.totalDebt)

  return {
    totalSales, totalPaid, totalDebt, totalCapital, totalProfit, cashSales, creditSales,
    totalTransactions: transactions.length,
    totalPaymentsReceived: payments.reduce((s: number, p: any) => s + p.amount, 0),
    monthlyReport,
    remainingCapital: totalPaid - totalCapital,
    activeDebtors: debtByBuyer.length,
    totalBuyers: buyers.length,
    totalProducts: (await getProducts()).length,
    debtByBuyer,
  }
}

// ==================== SEED ====================

export async function seedDatabase() {
  const existingBuyers = await db.buyer.findFirst()
  if (existingBuyers) {
    return { message: 'Database sudah memiliki data, seed dibatalkan.', seeded: false }
  }

  await db.buyer.createMany({
    data: INITIAL_BUYERS.map((name) => ({
      name,
      phone: '',
      address: '',
    })),
  })

  return { message: `Berhasil menambahkan ${INITIAL_BUYERS.length} pembeli awal.`, seeded: true }
}

// ==================== BACKUP ====================

export async function exportAllData() {
  const [buyers, products, transactions, payments] = await Promise.all([
    getBuyers(), getProducts(), getTransactions(), getPayments(),
  ])

  return {
    buyers,
    products,
    transactions: transactions.map((t: any) => ({
      id: t.id, buyerId: t.buyerId, date: t.date,
      totalAmount: t.totalAmount, paidAmount: t.paidAmount,
      type: t.type, status: t.status, notes: t.notes,
      items: t.items, createdAt: t.createdAt,
    })),
    payments: payments.map((p: any) => ({
      id: p.id, buyerId: p.buyerId, transactionId: p.transactionId,
      amount: p.amount, date: p.date, notes: p.notes, createdAt: p.createdAt,
    })),
    exportedAt: new Date().toISOString(),
  }
}

export async function importAllData(data: {
  buyers?: any[]; products?: any[]; transactions?: any[]; payments?: any[]
}) {
  if (data.buyers && data.buyers.length > 0) {
    for (const b of data.buyers) {
      await db.buyer.upsert({
        where: { id: b.id },
        update: { name: b.name, phone: b.phone || '', address: b.address || '' },
        create: { id: b.id, name: b.name, phone: b.phone || '', address: b.address || '' },
      })
    }
  }

  if (data.products && data.products.length > 0) {
    for (const p of data.products) {
      await db.product.upsert({
        where: { id: p.id },
        update: { name: p.name, unit: p.unit || 'pcs', buyPrice: p.buyPrice || 0, sellPrice: p.sellPrice || 0, stock: p.stock || 0 },
        create: { id: p.id, name: p.name, unit: p.unit || 'pcs', buyPrice: p.buyPrice || 0, sellPrice: p.sellPrice || 0, stock: p.stock || 0 },
      })
    }
  }

  if (data.transactions && data.transactions.length > 0) {
    for (const t of data.transactions) {
      await db.transaction.upsert({
        where: { id: t.id },
        update: {
          buyerId: t.buyerId, date: new Date(t.date),
          totalAmount: t.totalAmount, paidAmount: t.paidAmount,
          type: t.type, status: t.status, notes: t.notes || '',
        },
        create: {
          id: t.id, buyerId: t.buyerId, date: new Date(t.date),
          totalAmount: t.totalAmount, paidAmount: t.paidAmount,
          type: t.type, status: t.status, notes: t.notes || '',
        },
      })

      if (t.items && t.items.length > 0) {
        // Delete existing items first
        await db.transactionItem.deleteMany({ where: { transactionId: t.id } })
        for (const [idx, i] of t.items.entries()) {
          await db.transactionItem.create({
            data: {
              transactionId: t.id,
              productId: i.productId || '',
              quantity: i.quantity,
              buyPrice: i.buyPrice || 0,
              sellPrice: i.sellPrice || 0,
              subtotal: i.subtotal || 0,
            },
          })
        }
      }
    }
  }

  if (data.payments && data.payments.length > 0) {
    for (const p of data.payments) {
      await db.payment.upsert({
        where: { id: p.id },
        update: {
          buyerId: p.buyerId, transactionId: p.transactionId || null,
          amount: p.amount, date: new Date(p.date), notes: p.notes || '',
        },
        create: {
          id: p.id, buyerId: p.buyerId, transactionId: p.transactionId || null,
          amount: p.amount, date: new Date(p.date), notes: p.notes || '',
        },
      })
    }
  }

  return { success: true, message: 'Data berhasil diimport' }
}
