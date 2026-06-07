import { supabase, isSupabaseReady } from './supabase'

const INITIAL_BUYERS = [
  "Aikbal", "Adani", "M Jamang", "M Daday", "M Idad", "B Rama", "M Deden",
  "Om Gozin", "M Tupi", "B Wawan", "M Jae", "M Aris", "M Jop", "M Rudi",
  "Fadil", "M Gojlag", "Dayat", "M Gareng", "Yuda", "M Andi", "M Asi"
]

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function checkSupabase() {
  if (!isSupabaseReady || !supabase) {
    throw new Error('Database belum dikonfigurasi. Silakan hubungkan Supabase terlebih dahulu.')
  }
}

// ==================== BUYERS ====================

export async function getBuyers() {
  checkSupabase()
  const { data, error } = await supabase!.from('buyers').select('*').order('created_at', { ascending: true })
  if (error) throw new Error('Gagal mengambil data pembeli: ' + error.message)
  return data.map((b: any) => ({
    id: b.id,
    name: b.name,
    phone: b.phone || '',
    address: b.address || '',
    createdAt: b.created_at,
  }))
}

export async function createBuyer(input: { name: string; phone?: string; address?: string }) {
  checkSupabase()
  const id = generateId()
  const { data, error } = await supabase!.from('buyers').insert({
    id,
    name: input.name,
    phone: input.phone || '',
    address: input.address || '',
  }).select().single()
  if (error) throw new Error('Gagal menambah pembeli: ' + error.message)
  return {
    id: data.id,
    name: data.name,
    phone: data.phone || '',
    address: data.address || '',
    createdAt: data.created_at,
    totalDebt: 0,
  }
}

export async function updateBuyer(id: string, input: { name: string; phone?: string; address?: string }) {
  checkSupabase()
  const { data, error } = await supabase!.from('buyers').update({
    name: input.name,
    phone: input.phone || '',
    address: input.address || '',
  }).eq('id', id).select().single()
  if (error) throw new Error('Gagal mengupdate pembeli: ' + error.message)
  return {
    id: data.id,
    name: data.name,
    phone: data.phone || '',
    address: data.address || '',
    createdAt: data.created_at,
  }
}

export async function deleteBuyer(id: string) {
  checkSupabase()
  // 1. Delete payments yang refer ke buyer ini
  await supabase!.from('payments').delete().eq('buyer_id', id)
  // 2. Delete transaction_items yang refer ke transactions buyer ini
  const { data: buyerTx } = await supabase!.from('transactions').select('id').eq('buyer_id', id)
  if (buyerTx && buyerTx.length > 0) {
    const txIds = buyerTx.map((t: any) => t.id)
    for (const txId of txIds) {
      await supabase!.from('transaction_items').delete().eq('transaction_id', txId)
    }
  }
  // 3. Delete transactions buyer ini
  await supabase!.from('transactions').delete().eq('buyer_id', id)
  // 4. Delete buyer
  const { error } = await supabase!.from('buyers').delete().eq('id', id)
  if (error) throw new Error('Gagal menghapus pembeli: ' + error.message)
  return { success: true }
}

// ==================== PRODUCTS ====================

export async function getProducts() {
  checkSupabase()
  const { data, error } = await supabase!.from('products').select('*').order('created_at', { ascending: true })
  if (error) throw new Error('Gagal mengambil data produk: ' + error.message)
  return data.map((p: any) => ({
    id: p.id,
    name: p.name,
    unit: p.unit || 'pcs',
    buyPrice: Number(p.buy_price),
    sellPrice: Number(p.sell_price),
    stock: p.stock,
    createdAt: p.created_at,
  }))
}

export async function createProduct(input: { name: string; unit: string; buyPrice: number; sellPrice: number; stock: number }) {
  checkSupabase()
  const id = generateId()
  const { data, error } = await supabase!.from('products').insert({
    id,
    name: input.name,
    unit: input.unit,
    buy_price: input.buyPrice,
    sell_price: input.sellPrice,
    stock: input.stock,
  }).select().single()
  if (error) throw new Error('Gagal menambah produk: ' + error.message)
  return {
    id: data.id,
    name: data.name,
    unit: data.unit || 'pcs',
    buyPrice: Number(data.buy_price),
    sellPrice: Number(data.sell_price),
    stock: data.stock,
    createdAt: data.created_at,
  }
}

export async function updateProduct(id: string, input: { name: string; unit: string; buyPrice: number; sellPrice: number; stock: number }) {
  checkSupabase()
  const { data, error } = await supabase!.from('products').update({
    name: input.name,
    unit: input.unit,
    buy_price: input.buyPrice,
    sell_price: input.sellPrice,
    stock: input.stock,
  }).eq('id', id).select().single()
  if (error) throw new Error('Gagal mengupdate produk: ' + error.message)
  if (!data) throw new Error('Produk tidak ditemukan')
  return {
    id: data.id,
    name: data.name,
    unit: data.unit || 'pcs',
    buyPrice: Number(data.buy_price),
    sellPrice: Number(data.sell_price),
    stock: data.stock,
    createdAt: data.created_at,
  }
}

export async function deleteProduct(id: string) {
  checkSupabase()

  // Step 1: Try to nullify product_id in transaction_items first
  // (this is a safety measure in case ON DELETE SET NULL isn't working)
  try {
    await supabase!
      .from('transaction_items')
      .update({ product_id: null })
      .eq('product_id', id)
  } catch (e) {
    console.warn('Warning: gagal nullify product_id di transaction_items:', e)
  }

  // Step 2: Try to delete the product directly
  const { error } = await supabase!.from('products').delete().eq('id', id)
  if (!error) return { success: true }

  // Step 3: If direct delete failed, try deleting referencing transaction_items first
  console.warn('Direct delete failed, trying to remove transaction_items references:', error.message)
  try {
    await supabase!.from('transaction_items').delete().eq('product_id', id)
  } catch (e) {
    console.warn('Warning: gagal hapus transaction_items:', e)
  }

  // Step 4: Try delete again
  const { error: error2 } = await supabase!.from('products').delete().eq('id', id)
  if (error2) throw new Error('Gagal menghapus produk: ' + error2.message)
  return { success: true }
}

// ==================== TRANSACTIONS ====================

export async function getTransactions() {
  checkSupabase()
  const { data, error } = await supabase!.from('transactions').select('*, transaction_items(*)').order('date', { ascending: false })
  if (error) throw new Error('Gagal mengambil data transaksi: ' + error.message)
  const buyers = await getBuyers()
  return data.map((t: any) => ({
    id: t.id,
    buyerId: t.buyer_id,
    date: t.date,
    totalAmount: Number(t.total_amount),
    paidAmount: Number(t.paid_amount),
    type: t.type,
    status: t.status,
    notes: t.notes || '',
    items: (t.transaction_items || []).map((i: any) => ({
      productId: i.product_id || '',
      productName: i.product_name || '',
      quantity: i.quantity,
      buyPrice: Number(i.buy_price),
      sellPrice: Number(i.sell_price),
      subtotal: Number(i.subtotal),
    })),
    createdAt: t.created_at,
    buyer: buyers.find((b: any) => b.id === t.buyer_id) || { name: 'Unknown' },
  }))
}

export async function createTransaction(input: {
  buyerId: string; type: string; paidAmount: number; notes: string; date: string
  items: { productId: string; productName: string; quantity: number; buyPrice: number; sellPrice: number; subtotal: number }[]
  totalAmount: number
}) {
  checkSupabase()

  // Validate buyer exists
  const { data: buyerCheck } = await supabase!.from('buyers').select('id').eq('id', input.buyerId).single()
  if (!buyerCheck) throw new Error('Pembeli tidak ditemukan')

  const paidAmount = input.type === 'CASH' ? input.totalAmount : input.paidAmount
  let status = 'PAID'
  if (input.type === 'CREDIT') {
    if (paidAmount <= 0) status = 'UNPAID'
    else if (paidAmount < input.totalAmount) status = 'PARTIAL'
  }

  const id = generateId()
  const { data: tx, error: txError } = await supabase!.from('transactions').insert({
    id,
    buyer_id: input.buyerId,
    date: input.date || new Date().toISOString(),
    total_amount: input.totalAmount,
    paid_amount: paidAmount,
    type: input.type,
    status,
    notes: input.notes || '',
  }).select().single()
  if (txError) throw new Error('Gagal simpan transaksi: ' + txError.message)

  if (input.items && input.items.length > 0) {
    const items = input.items.map((item, idx) => ({
      id: `${id}_item_${idx}`,
      transaction_id: id,
      product_id: item.productId || null,
      product_name: item.productName || '',
      quantity: item.quantity,
      buy_price: item.buyPrice,
      sell_price: item.sellPrice,
      subtotal: item.subtotal,
    }))
    const { error: itemsError } = await supabase!.from('transaction_items').insert(items)
    if (itemsError) throw new Error('Gagal simpan item transaksi: ' + itemsError.message)

    // Update stock
    for (const item of input.items) {
      if (!item.productId) continue
      const { data: prod } = await supabase!.from('products').select('stock').eq('id', item.productId).single()
      if (prod) {
        const newStock = Math.max(0, prod.stock - item.quantity)
        await supabase!.from('products').update({ stock: newStock }).eq('id', item.productId)
      }
    }
  }

  const buyers = await getBuyers()
  return {
    id: tx.id,
    buyerId: tx.buyer_id,
    date: tx.date,
    totalAmount: Number(tx.total_amount),
    paidAmount: Number(tx.paid_amount),
    type: tx.type,
    status: tx.status,
    notes: tx.notes || '',
    items: input.items,
    createdAt: tx.created_at,
    buyer: buyers.find((b: any) => b.id === tx.buyer_id) || { name: 'Unknown' },
  }
}

export async function deleteTransaction(id: string) {
  checkSupabase()
  // 1. Get items untuk restore stock
  const { data: items } = await supabase!.from('transaction_items').select('*').eq('transaction_id', id)
  if (items && items.length > 0) {
    for (const item of items) {
      if (!item.product_id) continue
      const { data: prod } = await supabase!.from('products').select('stock').eq('id', item.product_id).single()
      if (prod) {
        const newStock = prod.stock + item.quantity
        await supabase!.from('products').update({ stock: newStock }).eq('id', item.product_id)
      }
    }
  }
  // 2. Delete transaction items dulu
  const { error: itemsDelError } = await supabase!.from('transaction_items').delete().eq('transaction_id', id)
  if (itemsDelError) throw new Error('Gagal hapus item transaksi: ' + itemsDelError.message)
  // 3. Delete payments yang refer ke transaksi ini
  await supabase!.from('payments').delete().eq('transaction_id', id)
  // 4. Delete transaction
  const { error } = await supabase!.from('transactions').delete().eq('id', id)
  if (error) throw new Error('Gagal menghapus transaksi: ' + error.message)
  return { success: true, message: 'Transaksi berhasil dihapus' }
}

// ==================== PAYMENTS ====================

export async function getPayments() {
  checkSupabase()
  const { data, error } = await supabase!.from('payments').select('*').order('date', { ascending: false })
  if (error) throw new Error('Gagal mengambil data pembayaran: ' + error.message)
  const buyers = await getBuyers()
  return data.map((p: any) => ({
    id: p.id,
    buyerId: p.buyer_id,
    transactionId: p.transaction_id,
    amount: Number(p.amount),
    date: p.date,
    notes: p.notes || '',
    createdAt: p.created_at,
    buyer: buyers.find((b: any) => b.id === p.buyer_id) || { name: 'Unknown' },
  }))
}

export async function createPayment(input: { buyerId: string; amount: number; date: string; notes: string }) {
  checkSupabase()
  // Get unpaid transactions
  const { data: unpaidTx, error: txError } = await supabase!.from('transactions')
    .select('*').eq('buyer_id', input.buyerId).in('status', ['UNPAID', 'PARTIAL']).order('date', { ascending: true })
  if (txError) throw new Error('Gagal mengambil transaksi belum bayar: ' + txError.message)

  let remaining = input.amount
  let firstTxId: string | null = null

  for (const tx of (unpaidTx || [])) {
    if (remaining <= 0) break
    const owing = Number(tx.total_amount) - Number(tx.paid_amount)
    if (owing <= 0) continue
    const payForThis = Math.min(remaining, owing)
    const newPaid = Number(tx.paid_amount) + payForThis
    let newStatus = 'PAID'
    if (newPaid <= 0) newStatus = 'UNPAID'
    else if (newPaid < Number(tx.total_amount)) newStatus = 'PARTIAL'

    await supabase!.from('transactions').update({ paid_amount: newPaid, status: newStatus }).eq('id', tx.id)
    if (!firstTxId) firstTxId = tx.id
    remaining -= payForThis
  }

  const id = generateId()
  const { data: payment, error: payError } = await supabase!.from('payments').insert({
    id,
    buyer_id: input.buyerId,
    transaction_id: firstTxId,
    amount: input.amount,
    date: input.date || new Date().toISOString(),
    notes: input.notes || '',
  }).select().single()
  if (payError) throw new Error('Gagal simpan pembayaran: ' + payError.message)

  const buyers = await getBuyers()
  return {
    id: payment.id,
    buyerId: payment.buyer_id,
    transactionId: payment.transaction_id,
    amount: Number(payment.amount),
    date: payment.date,
    notes: payment.notes || '',
    createdAt: payment.created_at,
    buyer: buyers.find((b: any) => b.id === payment.buyer_id) || { name: 'Unknown' },
  }
}

export async function deletePayment(id: string) {
  checkSupabase()
  // 1. Get payment info
  const { data: payment, error: payError } = await supabase!.from('payments').select('*').eq('id', id).single()
  if (payError || !payment) throw new Error('Pembayaran tidak ditemukan')

  const buyerId = payment.buyer_id
  const payAmount = Number(payment.amount)

  // 2. Reverse the payment effect on transactions
  // Get buyer's transactions that have paid_amount > 0, sorted by date descending
  const { data: buyerTx, error: txError } = await supabase!.from('transactions')
    .select('*').eq('buyer_id', buyerId).gt('paid_amount', 0).order('date', { ascending: false })
  if (txError) throw new Error('Gagal mengambil transaksi: ' + txError.message)

  let remaining = payAmount
  for (const tx of (buyerTx || [])) {
    if (remaining <= 0) break
    const currentPaid = Number(tx.paid_amount)
    const reduceBy = Math.min(remaining, currentPaid)
    const newPaid = currentPaid - reduceBy
    let newStatus = 'PAID'
    if (newPaid <= 0) newStatus = 'UNPAID'
    else if (newPaid < Number(tx.total_amount)) newStatus = 'PARTIAL'

    await supabase!.from('transactions').update({ paid_amount: newPaid, status: newStatus }).eq('id', tx.id)
    remaining -= reduceBy
  }

  // 3. Delete the payment
  const { error } = await supabase!.from('payments').delete().eq('id', id)
  if (error) throw new Error('Gagal menghapus pembayaran: ' + error.message)
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
  checkSupabase()

  const { data: existingBuyers } = await supabase!.from('buyers').select('id').limit(1)
  if (existingBuyers && existingBuyers.length > 0) {
    return { message: 'Database sudah memiliki data, seed dibatalkan.', seeded: false }
  }

  const buyers = INITIAL_BUYERS.map((name, i) => ({
    id: 'b' + String(i + 1).padStart(2, '0'),
    name,
    phone: '',
    address: '',
  }))

  const { error } = await supabase!.from('buyers').insert(buyers)
  if (error) throw new Error('Gagal seed data pembeli: ' + error.message)

  return { message: `Berhasil menambahkan ${buyers.length} pembeli awal.`, seeded: true }
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
  checkSupabase()

  if (data.buyers && data.buyers.length > 0) {
    const buyers = data.buyers.map((b: any) => ({
      id: b.id,
      name: b.name,
      phone: b.phone || '',
      address: b.address || '',
    }))
    const { error } = await supabase!.from('buyers').upsert(buyers, { onConflict: 'id' })
    if (error) throw new Error('Gagal import buyers: ' + error.message)
  }

  if (data.products && data.products.length > 0) {
    const products = data.products.map((p: any) => ({
      id: p.id,
      name: p.name,
      unit: p.unit || 'pcs',
      buy_price: p.buyPrice || 0,
      sell_price: p.sellPrice || 0,
      stock: p.stock || 0,
    }))
    const { error } = await supabase!.from('products').upsert(products, { onConflict: 'id' })
    if (error) throw new Error('Gagal import products: ' + error.message)
  }

  if (data.transactions && data.transactions.length > 0) {
    for (const t of data.transactions) {
      const { error: txError } = await supabase!.from('transactions').upsert({
        id: t.id,
        buyer_id: t.buyerId,
        date: t.date,
        total_amount: t.totalAmount,
        paid_amount: t.paidAmount,
        type: t.type,
        status: t.status,
        notes: t.notes || '',
      }, { onConflict: 'id' })
      if (txError) throw new Error('Gagal import transaction: ' + txError.message)

      if (t.items && t.items.length > 0) {
        const items = t.items.map((i: any, idx: number) => ({
          id: `${t.id}_item_${idx}`,
          transaction_id: t.id,
          product_id: i.productId || null,
          product_name: i.productName || '',
          quantity: i.quantity,
          buy_price: i.buyPrice || 0,
          sell_price: i.sellPrice || 0,
          subtotal: i.subtotal || 0,
        }))
        const { error: itemsError } = await supabase!.from('transaction_items').upsert(items, { onConflict: 'id' })
        if (itemsError) throw new Error('Gagal import transaction items: ' + itemsError.message)
      }
    }
  }

  if (data.payments && data.payments.length > 0) {
    const payments = data.payments.map((p: any) => ({
      id: p.id,
      buyer_id: p.buyerId,
      transaction_id: p.transactionId || null,
      amount: p.amount,
      date: p.date,
      notes: p.notes || '',
    }))
    const { error } = await supabase!.from('payments').upsert(payments, { onConflict: 'id' })
    if (error) throw new Error('Gagal import payments: ' + error.message)
  }

  return { success: true, message: 'Data berhasil diimport ke Supabase' }
}
