"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface SupabaseSetupProps {
  onConfigured: () => void
}

export function SupabaseSetup({ onConfigured }: SupabaseSetupProps) {
  const { toast } = useToast()
  const [checking, setChecking] = useState(true)
  const [notConfigured, setNotConfigured] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/setup-status")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          if (data.configured) {
            onConfigured()
          } else {
            setNotConfigured(true)
          }
        }
      })
      .catch(() => {
        if (!cancelled) setNotConfigured(true)
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })

    return () => { cancelled = true }
  }, [onConfigured])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.20_0.08_250)] via-[oklch(0.25_0.10_250)] to-[oklch(0.15_0.06_250)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center animate-pulse">
            <span className="text-3xl">🏪</span>
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span className="text-sm">Mengecek koneksi database...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!notConfigured) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.20_0.08_250)] via-[oklch(0.25_0.10_250)] to-[oklch(0.15_0.06_250)] p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/3 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-lg border-0 shadow-2xl relative z-10">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-[oklch(0.35_0.12_250)]">
            Setup Supabase
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Database belum dikonfigurasi. Hubungkan ke Supabase untuk menyimpan data secara online.
          </p>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-4">
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 text-sm space-y-3">
              <p className="font-semibold text-blue-800">Langkah-langkah:</p>
              <ol className="list-decimal list-inside space-y-2 text-blue-700">
                <li>Buat project di <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">supabase.com</a></li>
                <li>Copy Project URL dan Service Role Key dari Settings → API</li>
                <li>Jalankan SQL schema di SQL Editor (lihat file <code className="bg-blue-100 px-1 rounded">supabase-schema.sql</code>)</li>
                <li>Tambahkan URL & Key ke environment variables</li>
              </ol>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 text-sm font-mono space-y-1">
              <p className="text-muted-foreground font-sans text-xs mb-2">Environment Variables:</p>
              <p>NEXT_PUBLIC_SUPABASE_URL=<span className="text-emerald-600">https://xxx.supabase.co</span></p>
              <p>SUPABASE_SERVICE_ROLE_KEY=<span className="text-emerald-600">eyJhbGci...</span></p>
            </div>

            <Button
              onClick={() => {
                fetch("/api/setup-status")
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.configured) {
                      toast({ title: "Berhasil!", description: "Supabase terhubung" })
                      onConfigured()
                    } else {
                      toast({
                        title: "Belum terhubung",
                        description: "Pastikan env vars sudah diatur dan server di-restart",
                        variant: "destructive",
                      })
                    }
                  })
              }}
              className="w-full h-12 text-base font-semibold bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)] text-white shadow-lg"
            >
              Cek Koneksi Supabase
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
