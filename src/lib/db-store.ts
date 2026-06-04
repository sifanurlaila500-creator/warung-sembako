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
 * Data Storage Layer
 * 
 * Di Vercel: pakai Vercel KV (JSON store di cloud) — data sync di semua device
 * Di lokal: pakai file JSON biasa — data di folder /data
 * 
 * Vercel KV itu cuma JSON store di cloud. Format datanya tetap JSON,
 * cara pakainya juga sama (get/set). Cuma bedanya disimpan di cloud
 * biar bisa diakses dari mana aja.
 * 
 * Cara setup Vercel KV:
 * 1. Buka Vercel Dashboard
 * 2. Pilih project → tab Storage
 * 3. Create Database → KV (Redis)
 * 4. Hubungkan ke project
 * 5. Redeploy (otomatis)
 */

// Cache KV instance supaya nggak import berulang-ulang
let kvInstance: any = null
let kvChecked = false

async function getKv() {
  if (kvChecked) return kvInstance
  kvChecked = true
  
  try {
    const mod = await import('@vercel/kv')
    kvInstance = mod.kv
    // Test koneksi
    await kvInstance.get('__test__')
    return kvInstance
  } catch (err) {
    console.log('KV tidak tersedia, pakai JSON file:', err instanceof Error ? err.message : String(err))
    kvInstance = null
    return null
  }
}

export function getStorageMode(): { mode: 'kv' | 'json'; warning?: string } {
  // Cek apakah env vars KV ada
  const hasKVEnv = !!(process.env.KV_REST_API_URL || process.env.KV_URL)
  const isVercel = !!process.env.VERCEL
  
  if (hasKVEnv) return { mode: 'kv' }
  if (isVercel && !hasKVEnv) {
    return {
      mode: 'json',
      warning: '⚠️ Vercel KV belum diatur! Data tidak bisa disimpan di Vercel. Buka Dashboard → Storage → Create KV → Hubungkan ke project.'
    }
  }
  return { mode: 'json' }
}

export async function getData<T>(filename: string): Promise<T[]> {
  const key = filename.replace('.json', '')
  
  // Selalu coba KV dulu (di Vercel)
  const kv = await getKv()
  if (kv) {
    try {
      let data = await kv.get<T[]>(key)
      
      // Auto-seed buyers kalau pertama kali
      if (data === null && key === 'buyers') {
        data = seedBuyers() as T[]
        await kv.set('buyers', data)
        await kv.set('products', [])
        await kv.set('transactions', [])
        await kv.set('payments', [])
      }
      
      return data || []
    } catch (err) {
      console.error('KV read error:', err)
      // Jatuh ke JSON file
    }
  }
  
  // JSON file storage (lokal)
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
  const key = filename.replace('.json', '')
  
  // Selalu coba KV dulu (di Vercel)
  const kv = await getKv()
  if (kv) {
    try {
      await kv.set(key, data)
      return
    } catch (err) {
      console.error('KV write error:', err)
      // Jatuh ke JSON file
    }
  }
  
  // JSON file storage (lokal)
  // Di Vercel tanpa KV, ini akan gagal — tapi kita coba aja
  try {
    writeData(filename, data)
  } catch (err) {
    throw new Error(
      'Gagal menyimpan data! Di Vercel, file JSON tidak bisa ditulis. ' +
      'Solusi: Buka Vercel Dashboard → project ini → tab Storage → Create Database → KV (Redis) → Hubungkan ke project → Redeploy.'
    )
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}
