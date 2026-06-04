import { readData, writeData } from './json-db'

// Check if we're in a Vercel environment with KV configured
const useKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)

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

/**
 * Unified data layer:
 * - Production (Vercel): Uses Vercel KV (Redis)
 * - Development (Local): Uses JSON files in /data directory
 * Auto-seeds initial buyers on first access.
 */

export async function getData<T>(filename: string): Promise<T[]> {
  if (useKV) {
    try {
      const { kv } = await import('@vercel/kv')
      const key = filename.replace('.json', '')
      let data = await kv.get<T[]>(key)

      // Auto-seed if buyers is null (first time on KV)
      if (data === null && key === 'buyers') {
        data = seedBuyers() as T[]
        await kv.set('buyers', data)
        await kv.set('products', [])
        await kv.set('transactions', [])
        await kv.set('payments', [])
      }

      return data || []
    } catch (error) {
      console.error('KV read error, falling back to JSON:', error)
      return readData<T>(filename)
    }
  }

  // JSON file storage
  let data = readData<T>(filename)

  // Auto-seed if buyers is empty (first time locally)
  if (data.length === 0 && filename === 'buyers.json') {
    data = seedBuyers() as T[]
    writeData('buyers.json', data)
    writeData('products.json', [])
    writeData('transactions.json', [])
    writeData('payments.json', [])
  }

  return data
}

export async function setData<T>(filename: string, data: T[]): Promise<void> {
  if (useKV) {
    try {
      const { kv } = await import('@vercel/kv')
      const key = filename.replace('.json', '')
      await kv.set(key, data)
      return
    } catch (error) {
      console.error('KV write error, falling back to JSON:', error)
      writeData(filename, data)
      return
    }
  }
  writeData(filename, data)
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}
