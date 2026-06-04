/**
 * Client-side data store using localStorage.
 * Works everywhere — Vercel, Netlify, any static hosting.
 * No server-side database needed.
 */

const PREFIX = 'warung_'

const INITIAL_BUYERS = [
  "Aikbal", "Adani", "M Jamang", "M Daday", "M Idad", "B Rama", "M Deden",
  "Om Gozin", "M Tupi", "B Wawan", "M Jae", "M Aris", "M Jop", "M Rudi",
  "Fadil", "M Gojlag", "Dayat", "M Gareng", "Yuda", "M Andi", "M Asi"
]

function getKey(name: string): string {
  return PREFIX + name
}

export function getClientData<T>(name: string): T[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(getKey(name))
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function setClientData<T>(name: string, data: T[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(getKey(name), JSON.stringify(data))
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

/**
 * Seed initial data if localStorage is empty (first visit).
 * Called once on app load.
 */
export function seedInitialData(): void {
  if (typeof window === 'undefined') return

  // Check if already seeded
  const existing = localStorage.getItem(getKey('seeded'))
  if (existing) return

  // Seed buyers
  const buyers = INITIAL_BUYERS.map((name, i) => ({
    id: 'b' + String(i + 1).padStart(2, '0'),
    name,
    phone: '',
    address: '',
    createdAt: new Date().toISOString(),
  }))
  setClientData('buyers', buyers)

  // Initialize empty arrays for other data
  setClientData('products', [])
  setClientData('transactions', [])
  setClientData('payments', [])

  localStorage.setItem(getKey('seeded'), 'true')
}

/**
 * Export all data as a JSON string (for backup).
 */
export function exportAllData(): string {
  return JSON.stringify({
    buyers: getClientData('buyers'),
    products: getClientData('products'),
    transactions: getClientData('transactions'),
    payments: getClientData('payments'),
    exportedAt: new Date().toISOString(),
  }, null, 2)
}

/**
 * Import data from a JSON string (restore backup).
 */
export function importAllData(json: string): boolean {
  try {
    const data = JSON.parse(json)
    if (data.buyers) setClientData('buyers', data.buyers)
    if (data.products) setClientData('products', data.products)
    if (data.transactions) setClientData('transactions', data.transactions)
    if (data.payments) setClientData('payments', data.payments)
    return true
  } catch {
    return false
  }
}
