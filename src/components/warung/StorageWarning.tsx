"use client"

import { useState, useEffect } from "react"

interface StorageStatus {
  mode: 'kv' | 'json' | 'readonly'
  warning?: string
  isVercel: boolean
  kvConfigured: boolean
}

export function StorageWarning() {
  const [status, setStatus] = useState<StorageStatus | null>(null)

  useEffect(() => {
    fetch("/api/storage-status")
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus(null))
  }, [])

  // Don't show warning if KV is configured or if we're not on Vercel
  if (!status || status.mode !== 'readonly') return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <path d="M12 9v4"/><path d="M12 17h.01"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800">Penyimpanan Belum Dikonfigurasi</p>
          <p className="text-xs text-amber-700 mt-1">
            Data tidak bisa disimpan/dihapus karena Vercel KV belum diatur. Semua perubahan (tambah, edit, hapus) akan gagal.
          </p>
          <div className="mt-2 p-2 bg-amber-100/80 rounded text-xs text-amber-800 space-y-1">
            <p className="font-semibold">Cara Mengatur Vercel KV:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Buka <strong>Vercel Dashboard</strong></li>
              <li>Pilih project <strong>warung-sembako</strong></li>
              <li>Klik tab <strong>Storage</strong></li>
              <li>Klik <strong>Create Database</strong> → pilih <strong>KV (Redis)</strong></li>
              <li>Hubungkan ke project ini</li>
              <li>Redeploy (otomatis setelah connect)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
