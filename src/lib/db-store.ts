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

/**
 * Data Storage Layer - JSON File Only
 * Semua data disimpan di file JSON di folder /data
 */

export async function getData<T>(filename: string): Promise<T[]> {
  let data = readData<T>(filename)

  // Auto-seed buyers kalau pertama kali
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
  writeData(filename, data)
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}
