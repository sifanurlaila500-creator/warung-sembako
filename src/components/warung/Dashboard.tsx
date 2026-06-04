"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DashboardData {
  totalSales: number
  totalPaid: number
  totalDebt: number
  totalCapital: number
  totalProfit: number
  remainingCapital: number
  activeDebtors: number
  totalProducts: number
  totalBuyers: number
  debtByBuyer: { id: string; name: string; phone: string; totalDebt: number }[]
  recentTransactions: {
    id: string
    date: string
    type: string
    status: string
    totalAmount: number
    paidAmount: number
    buyer: { name: string }
    items: { product: { name: string }; quantity: number; subtotal: number }[]
  }[]
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n)
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          </div>
          <div className={cn("p-2.5 rounded-xl", color)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard")
      const d = await res.json()
      setData(d)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-0 shadow-md animate-pulse">
              <CardContent className="p-5">
                <div className="h-4 bg-muted rounded w-24 mb-2" />
                <div className="h-8 bg-muted rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return <p className="text-center text-muted-foreground py-10">Gagal memuat data</p>

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Penjualan"
          value={formatRupiah(data.totalSales)}
          color="bg-[oklch(0.35_0.12_250)]/10 text-[oklch(0.45_0.15_250)]"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <StatCard
          title="Total Hutang"
          value={formatRupiah(data.totalDebt)}
          color="bg-red-100 text-red-600"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        />
        <StatCard
          title="Total Modal"
          value={formatRupiah(data.totalCapital)}
          color="bg-amber-100 text-amber-600"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>}
        />
        <StatCard
          title="Sisa Modal"
          value={formatRupiah(data.remainingCapital)}
          color={data.remainingCapital >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-[oklch(0.35_0.12_250)]/10 text-[oklch(0.45_0.15_250)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pembeli Aktif Hutang</p>
              <p className="text-xl font-bold">{data.activeDebtors} orang</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Produk</p>
              <p className="text-xl font-bold">{data.totalProducts} item</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Keuntungan</p>
              <p className="text-xl font-bold">{formatRupiah(data.totalProfit)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debt by Buyer & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hutang per Pembeli */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[oklch(0.35_0.12_250)]"> Hutang per Pembeli</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {data.debtByBuyer.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Tidak ada hutang</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {data.debtByBuyer.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div>
                      <p className="font-medium text-sm">{d.name}</p>
                      {d.phone && <p className="text-xs text-muted-foreground">{d.phone}</p>}
                    </div>
                    <span className="font-bold text-sm text-red-600">{formatRupiah(d.totalDebt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaksi Terbaru */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[oklch(0.35_0.12_250)]">Transaksi Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {data.recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada transaksi</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {data.recentTransactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div>
                      <p className="font-medium text-sm">{t.buyer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}
                        {t.items.length} item
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatRupiah(t.totalAmount)}</p>
                      <Badge
                        variant={t.status === "PAID" ? "default" : t.status === "PARTIAL" ? "secondary" : "destructive"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {t.status === "PAID" ? "Lunas" : t.status === "PARTIAL" ? "Sebagian" : "Belum Bayar"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
