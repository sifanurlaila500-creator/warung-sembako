import { supabase, isSupabaseReady } from './supabase'
import { readData, writeData } from './json-db'

const INITIAL_BUYERS = [
  "Aikbal", "Adani", "M Jamang", "M Daday", "M Idad", "B Rama", "M Deden",
  "Om Gozin", "M Tupi", "B Wawan", "M Jae", "M Aris", "M Jop", "M Rudi",
  "Fadil", "M Gojlag", "Dayat", "M Gareng", "Yuda", "M Andi", "M Asi"
]

function seedBuyers() {
  return INITIAL_BUYERS.map((name, i) => ({
    id: 'b' + String(i + 1).padStart(2, '0'),
    name,
    phone: '',
    address: '',
    createdAt: new Date().toISOString(),
  }))
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

/**
 * Data Storage Layer
 * - Kalau Supabase dikonfigurasi → pakai Supabase (cloud, sync semua device)
 * - Kalau belum → fallback ke JSON file (lokal aja)
 */

// ==================== BUYERS ====================

export async function getBuyers() {
  if (isSupabaseReady && supabase) {
    const { data, error } = await supabase.from('buyers').select('*').order('created_at', { ascending: true })
    if (error) throw new Error(error.message)
    return data.map((b: any) => ({ id: b.id, name: b.name, phone: b.phone || '', address: b.address || '', createdAt: b.created_at }))
  }
  // JSON fallback
  let data = readData<any>('buyers.json')
  if (data.length === 0) {
    data = seedBuyers()
    writeData('buyers.json', data)
    writeData('products.json', [])
    writeData('transactions.json', [])
    writeData('payments.json', [])
  }
  return data
}

export async function createBuyer(input: { name: string; phone?: string; address?: string }) {
  if (isSupabaseReady && supabase) {
    const id = generateId()
    const { data, error } = await supabase.from('buyers').insert({ id, name: input.name, phone: input.phone || '', address: input.address || '' }).select().single()
    if (error) throw new Error(error.message)
    return { id: data.id, name: data.name, phone: data.phone || '', address: data.address || '', createdAt: data.created_at, totalDebt: 0 }
  }
  const buyers = readData<any>('buyers.json')
  const newBuyer = { id: generateId(), name: input.name, phone: input.phone || '', address: input.address || '', createdAt: new Date().toISOString() }
  buyers.push(newBuyer)
  writeData('buyers.json', buyers)
  return { ...newBuyer, totalDebt: 0 }
}

export async function updateBuyer(id: string, input: { name: string; phone?: string; address?: string }) {
  if (isSupabaseReady && supabase) {
    const { data, error } = await supabase.from('buyers').update({ name: input.name, phone: input.phone || '', address: input.address || '' }).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { id: data.id, name: data.name, phone: data.phone || '', address: data.address || '', createdAt: data.created_at }
  }
  const buyers = readData<any>('buyers.json')
  const idx = buyers.findIndex((b: any) => b.id === id)
  if (idx === -1) throw new Error('Pembeli tidak ditemukan')
  buyers[idx] = { ...buyers[idx], name: input.name, phone: input.phone || '', address: input.address || '' }
  writeData('buyers.json', buyers)
  return buyers[idx]
}

export async function deleteBuyer(id: string) {
  if (isSupabaseReady && supabase) {
    const { error } = await supabase.from('buyers').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  }
  const buyers = readData<any>('buyers.json')
  const filtered = buyers.filter((b: any) => b.id !== id)
  if (filtered.length === buyers.length) throw new Error('Pembeli tidak ditemukan')
  writeData('buyers.json', filtered)
  return { success: true }
}

// ==================== PRODUCTS ====================

export async function getProducts() {
  if (isSupabaseReady && supabase) {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: true })
    if (error) throw new Error(error.message)
    return data.map((p: any) => ({ id: p.id, name: p.name, unit: p.unit || 'pcs', buyPrice: Number(p.buy_price), sellPrice: Number(p.sell_price), stock: p.stock, createdAt: p.created_at }))
  }
  return readData<any>('products.json')
}

export async function createProduct(input: { name: string; unit: string; buyPrice: number; sellPrice: number; stock: number }) {
  if (isSupabaseReady && supabase) {
    const id = generateId()
    const { data, error } = await supabase.from('products').insert({ id, name: input.name, unit: input.unit, buy_price: input.buyPrice, sell_price: input.sellPrice, stock: input.stock }).select().single()
    if (error) throw new Error(error.message)
    return { id: data.id, name: data.name, unit: data.unit || 'pcs', buyPrice: Number(data.buy_price), sellPrice: Number(data.sell_price), stock: data.stock, createdAt: data.created_at }
  }
  const products = readData<any>('products.json')
  const newProduct = { id: generateId(), name: input.name, unit: input.unit || 'pcs', buyPrice: input.buyPrice, sellPrice: input.sellPrice, stock: input.stock, createdAt: new Date().toISOString() }
  products.push(newProduct)
  writeData('products.json', products)
  return newProduct
}

export async function updateProduct(id: string, input: { name: string; unit: string; buyPrice: number; sellPrice: number; stock: number }) {
  if (isSupabaseReady && supabase) {
    const { data, error } = await supabase.from('products').update({ name: input.name, unit: input.unit, buy_price: input.buyPrice, sell_price: input.sellPrice, stock: input.stock }).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { id: data.id, name: data.name, unit: data.unit || 'pcs', buyPrice: Number(data.buy_price), sellPrice: Number(data.sell_price), stock: data.stock, createdAt: data.created_at }
  }
  const products = readData<any>('products.json')
  const idx = products.findIndex((p: any) => p.id === id)
  if (idx === -1) throw new Error('Produk tidak ditemukan')
  products[idx] = { ...products[idx], name: input.name, unit: input.unit, buyPrice: input.buyPrice, sellPrice: input.sellPrice, stock: input.stock }
  writeData('products.json', products)
  return products[idx]
}

export async function deleteProduct(id: string) {
  if (isSupabaseReady && supabase) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  }
  const products = readData<any>('products.json')
  const filtered = products.filter((p: any) => p.id !== id)
  if (filtered.length === products.length) throw new Error('Produk tidak ditemukan')
  writeData('products.json', filtered)
  return { success: true }
}

// ==================== TRANSACTIONS ====================

export async function getTransactions() {
  if (isSupabaseReady && supabase) {
    const { data, error } = await supabase.from('transactions').select('*, transaction_items(*)').order('date', { ascending: false })
    if (error) throw new Error(error.message)
    const buyers = await getBuyers()
    return data.map((t: any) => ({
      id: t.id, buyerId: t.buyer_id, date: t.date,
      totalAmount: Number(t.total_amount), paidAmount: Number(t.paid_amount),
      type: t.type, status: t.status, notes: t.notes || '',
      items: (t.transaction_items || []).map((i: any) => ({
        productId: i.product_id || '', productName: i.product_name || '',
        quantity: i.quantity, buyPrice: Number(i.buy_price), sellPrice: Number(i.sell_price), subtotal: Number(i.subtotal),
      })),
      createdAt: t.created_at,
      buyer: buyers.find((b: any) => b.id === t.buyer_id) || { name: 'Unknown' },
    }))
  }
  // JSON fallback
  const transactions = readData<any>('transactions.json')
  const buyers = readData<any>('buyers.json')
  return transactions.map((t: any) => ({
    ...t, buyer: buyers.find((b: any) => b.id === t.buyerId) || { name: 'Unknown' },
  }))
}

export async function createTransaction(input: {
  buyerId: string; type: string; paidAmount: number; notes: string; date: string
  items: { productId: string; productName: string; quantity: number; buyPrice: number; sellPrice: number; subtotal: number }[]
  totalAmount: number
}) {
  const paidAmount = input.type === 'CASH' ? input.totalAmount : input.paidAmount
  let status = 'PAID'
  if (input.type === 'CREDIT') {
    if (paidAmount <= 0) status = 'UNPAID'
    else if (paidAmount < input.totalAmount) status = 'PARTIAL'
  }

  if (isSupabaseReady && supabase) {
    const id = generateId()
    const { data: tx, error: txError } = await supabase.from('transactions').insert({
      id, buyer_id: input.buyerId, date: input.date || new Date().toISOString(),
      total_amount: input.totalAmount, paid_amount: paidAmount,
      type: input.type, status, notes: input.notes,
    }).select().single()
    if (txError) throw new Error(txError.message)

    if (input.items && input.items.length > 0) {
      const items = input.items.map((item) => ({
        transaction_id: id, product_id: item.productId, product_name: item.productName,
        quantity: item.quantity, buy_price: item.buyPrice, sell_price: item.sellPrice, subtotal: item.subtotal,
      }))
      const { error: itemsError } = await supabase.from('transaction_items').insert(items)
      if (itemsError) throw new Error(itemsError.message)

      // Update stock
      for (const item of input.items) {
        const { data: prod } = await supabase.from('products').select('stock').eq('id', item.productId).single()
        if (prod) await supabase.from('products').update({ stock: Math.max(0, prod.stock - item.quantity) }).eq('id', item.productId)
      }
    }

    const buyers = await getBuyers()
    return {
      id: tx.id, buyerId: tx.buyer_id, date: tx.date,
      totalAmount: Number(tx.total_amount), paidAmount: Number(tx.paid_amount),
      type: tx.type, status: tx.status, notes: tx.notes || '',
      items: input.items, createdAt: tx.created_at,
      buyer: buyers.find((b: any) => b.id === tx.buyer_id) || { name: 'Unknown' },
    }
  }

  // JSON fallback
  const transactions = readData<any>('transactions.json')
  const products = readData<any>('products.json')

  // Update stock
  if (input.items && input.items.length > 0) {
    for (const item of input.items) {
      const pIdx = products.findIndex((p: any) => p.id === item.productId)
      if (pIdx !== -1) products[pIdx].stock = Math.max(0, products[pIdx].stock - item.quantity)
    }
    writeData('products.json', products)
  }

  const newTx = {
    id: generateId(), buyerId: input.buyerId,
    date: input.date || new Date().toISOString(),
    totalAmount: input.totalAmount, paidAmount,
    type: input.type, status, notes: input.notes || '',
    items: input.items || [],
    createdAt: new Date().toISOString(),
  }
  transactions.push(newTx)
  writeData('transactions.json', transactions)

  const buyers = readData<any>('buyers.json')
  return { ...newTx, buyer: buyers.find((b: any) => b.id === input.buyerId) || { name: 'Unknown' } }
}

export async function deleteTransaction(id: string) {
  if (isSupabaseReady && supabase) {
    // Get items to restore stock
    const { data: items } = await supabase.from('transaction_items').select('*').eq('transaction_id', id)
    if (items && items.length > 0) {
      for (const item of items) {
        const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single()
        if (prod) await supabase.from('products').update({ stock: prod.stock + item.quantity }).eq('id', item.product_id)
      }
    }
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true, message: 'Transaksi berhasil dihapus' }
  }

  // JSON fallback
  const transactions = readData<any>('transactions.json')
  const tx = transactions.find((t: any) => t.id === id)
  if (!tx) throw new Error('Transaksi tidak ditemukan')

  if (tx.items && tx.items.length > 0) {
    const products = readData<any>('products.json')
    for (const item of tx.items) {
      const pIdx = products.findIndex((p: any) => p.id === item.productId)
      if (pIdx !== -1) products[pIdx].stock += item.quantity
    }
    writeData('products.json', products)
  }

  const filtered = transactions.filter((t: any) => t.id !== id)
  writeData('transactions.json', filtered)
  return { success: true, message: 'Transaksi berhasil dihapus' }
}

// ==================== PAYMENTS ====================

export async function getPayments() {
  if (isSupabaseReady && supabase) {
    const { data, error } = await supabase.from('payments').select('*').order('date', { ascending: false })
    if (error) throw new Error(error.message)
    const buyers = await getBuyers()
    return data.map((p: any) => ({
      id: p.id, buyerId: p.buyer_id, transactionId: p.transaction_id,
      amount: Number(p.amount), date: p.date, notes: p.notes || '',
      createdAt: p.created_at,
      buyer: buyers.find((b: any) => b.id === p.buyer_id) || { name: 'Unknown' },
    }))
  }
  // JSON fallback
  const payments = readData<any>('payments.json')
  const buyers = readData<any>('buyers.json')
  return payments.map((p: any) => ({
    ...p, buyer: buyers.find((b: any) => b.id === p.buyerId) || { name: 'Unknown' },
  }))
}

export async function createPayment(input: { buyerId: string; amount: number; date: string; notes: string }) {
  if (isSupabaseReady && supabase) {
    // Get unpaid transactions
    const { data: unpaidTx, error: txError } = await supabase.from('transactions')
      .select('*').eq('buyer_id', input.buyerId).in('status', ['UNPAID', 'PARTIAL']).order('date', { ascending: true })
    if (txError) throw new Error(txError.message)

    let remaining = input.amount
    let firstTxId: string | null = null

    for (const tx of (unpaidTx || [])) {
      if (remaining <= 0) break
      const owing = Number(tx.total_amount) - Number(tx.paid_amount)
      const payForThis = Math.min(remaining, owing)
      const newPaid = Number(tx.paid_amount) + payForThis
      let newStatus = 'PAID'
      if (newPaid <= 0) newStatus = 'UNPAID'
      else if (newPaid < Number(tx.total_amount)) newStatus = 'PARTIAL'

      await supabase.from('transactions').update({ paid_amount: newPaid, status: newStatus }).eq('id', tx.id)
      if (!firstTxId) firstTxId = tx.id
      remaining -= payForThis
    }

    const id = generateId()
    const { data: payment, error: payError } = await supabase.from('payments').insert({
      id, buyer_id: input.buyerId, transaction_id: firstTxId,
      amount: input.amount, date: input.date || new Date().toISOString(), notes: input.notes,
    }).select().single()
    if (payError) throw new Error(payError.message)

    const buyers = await getBuyers()
    return {
      id: payment.id, buyerId: payment.buyer_id, transactionId: payment.transaction_id,
      amount: Number(payment.amount), date: payment.date, notes: payment.notes || '',
      createdAt: payment.created_at,
      buyer: buyers.find((b: any) => b.id === payment.buyer_id) || { name: 'Unknown' },
    }
  }

  // JSON fallback
  const transactions = readData<any>('transactions.json')
  const payments = readData<any>('payments.json')

  const unpaidTx = transactions
    .filter((t: any) => t.buyerId === input.buyerId && (t.status === 'UNPAID' || t.status === 'PARTIAL'))
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

  let remaining = input.amount
  let firstTxId: string | null = null

  for (const tx of unpaidTx) {
    if (remaining <= 0) break
    const owing = tx.totalAmount - tx.paidAmount
    const payForThis = Math.min(remaining, owing)
    const newPaid = tx.paidAmount + payForThis
    let newStatus = 'PAID'
    if (newPaid <= 0) newStatus = 'UNPAID'
    else if (newPaid < tx.totalAmount) newStatus = 'PARTIAL'

    const idx = transactions.findIndex((t: any) => t.id === tx.id)
    if (idx !== -1) {
      transactions[idx].paidAmount = newPaid
      transactions[idx].status = newStatus
    }
    if (!firstTxId) firstTxId = tx.id
    remaining -= payForThis
  }
  writeData('transactions.json', transactions)

  const newPayment = {
    id: generateId(), buyerId: input.buyerId, transactionId: firstTxId,
    amount: input.amount, date: input.date || new Date().toISOString(),
    notes: input.notes || '', createdAt: new Date().toISOString(),
  }
  payments.push(newPayment)
  writeData('payments.json', payments)

  const buyers = readData<any>('buyers.json')
  return { ...newPayment, buyer: buyers.find((b: any) => b.id === input.buyerId) || { name: 'Unknown' } }
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

  return {
    totalSales, totalPaid, totalDebt, totalCapital, totalProfit, cashSales, creditSales,
    totalTransactions: transactions.length,
    totalPaymentsReceived: payments.reduce((s: number, p: any) => s + p.amount, 0),
    monthlyReport,
  }
}
