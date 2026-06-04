import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export function readData<T>(filename: string): T[] {
  ensureDir()
  const filepath = path.join(DATA_DIR, filename)
  if (!fs.existsSync(filepath)) {
    return []
  }
  try {
    const raw = fs.readFileSync(filepath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function writeData<T>(filename: string, data: T[]): void {
  ensureDir()
  const filepath = path.join(DATA_DIR, filename)
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8')
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}
