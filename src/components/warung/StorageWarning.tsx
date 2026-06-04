"use client"

import { useState, useEffect } from "react"

interface StorageStatus {
  mode: 'kv' | 'json'
  warning?: string
}

export function StorageWarning() {
  const [status, setStatus] = useState<StorageStatus | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch("/api/storage-status")
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus(null))
  }, [])

  if (dismissed) return null
  if (!status || !status.warning) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2.5">
      <div className="flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <path d="M12 9v4"/><path d="M12 17h.01"/>
        </svg>
        <p className="text-xs text-amber-800 flex-1">
          <strong>Data tidak bisa disimpan!</strong> Vercel KV belum diatur. Buka Vercel Dashboard → Storage → Create KV → Hubungkan → Redeploy.
        </p>
        <button onClick={() => setDismissed(true)} className="text-amber-600 hover:text-amber-800 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
    </div>
  )
}
