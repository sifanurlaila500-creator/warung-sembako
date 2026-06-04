import { readData, writeData } from './json-db'

// Check if we're in a Vercel environment with KV configured
const useKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)

/**
 * Unified data layer:
 * - Production (Vercel): Uses Vercel KV (Redis)
 * - Development (Local): Uses JSON files in /data directory
 */

export async function getData<T>(filename: string): Promise<T[]> {
  if (useKV) {
    try {
      const { kv } = await import('@vercel/kv')
      const key = filename.replace('.json', '')
      const data = await kv.get<T[]>(key)
      return data || []
    } catch (error) {
      console.error('KV read error, falling back to JSON:', error)
      return readData<T>(filename)
    }
  }
  return readData<T>(filename)
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
