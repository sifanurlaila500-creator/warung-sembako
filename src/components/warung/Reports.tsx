"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ReportData {
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
    items: { product: { name: string }; quantity: number; buyPrice: number; sellPrice: number; subtotal: number }[]
  }[]
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n)
}

export function Reports() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchReport = useCallback(async () => {
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

  useEffect(() => { fetchReport() }, [fetchReport])

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse border-0 shadow-md">
            <CardContent className="p-5"><div className="h-40 bg-muted rounded" /></CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) return <p className="text-center text-muted-foreground py-10">Gagal memuat laporan</p>

  const totalCashSales = data.recentTransactions
    .filter((t) => t.type === "CASH")
    .reduce((s, t) => s + t.totalAmount, 0)
  const totalCreditSales = data.recentTransactions
    .filter((t) => t.type === "CREDIT")
    .reduce((s, t) => s + t.totalAmount, 0)

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="bg-[oklch(0.35_0.12_250)] p-5">
          <h2 className="text-xl font-bold text-white">Laporan Keuangan</h2>
          <p className="text-white/70 text-sm">Ringkasan keuangan warung sembako</p>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[oklch(0.35_0.12_250)]/5 border border-[oklch(0.35_0.12_250)]/10">
              <p className="text-sm text-muted-foreground">Total Penjualan</p>
              <p className="text-xl font-bold text-[oklch(0.35_0.12_250)]">{formatRupiah(data.totalSales)}</p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
              <p className="text-sm text-muted-foreground">Uang Masuk</p>
              <p className="text-xl font-bold text-emerald-600">{formatRupiah(data.totalPaid)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
              <p className="text-sm text-muted-foreground">Total Modal</p>
              <p className="text-xl font-bold text-amber-600">{formatRupiah(data.totalCapital)}</p>
            </div>
            <div className="p-4 rounded-lg bg-red-50 border border-red-100">
              <p className="text-sm text-muted-foreground">Total Hutang</p>
              <p className="text-xl font-bold text-red-600">{formatRupiah(data.totalDebt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit & Capital */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
              </div>
              <h3 className="font-semibold text-base">Keuntungan</h3>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{formatRupiah(data.totalProfit)}</p>
            <p className="text-sm text-muted-foreground mt-1">Selisih harga jual - harga beli</p>
            <div className="mt-3 pt-3 border-t space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Penjualan Tunai</span><span>{formatRupiah(totalCashSales)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Penjualan Utang</span><span>{formatRupiah(totalCreditSales)}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${data.remainingCapital >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              </div>
              <h3 className="font-semibold text-base">Sisa Modal</h3>
            </div>
            <p className={`text-3xl font-bold ${data.remainingCapital >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatRupiah(data.remainingCapital)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Uang masuk - total modal keluar</p>
            <div className="mt-3 pt-3 border-t space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Uang Masuk</span><span className="text-emerald-600">{formatRupiah(data.totalPaid)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Modal</span><span className="text-amber-600">- {formatRupiah(data.totalCapital)}</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>Sisa Modal</span><span className={data.remainingCapital >= 0 ? "text-emerald-600" : "text-red-600"}>{formatRupiah(data.remainingCapital)}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debt Summary */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-[oklch(0.35_0.12_250)]">Ringkasan Hutang per Pembeli</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {data.debtByBuyer.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Tidak ada hutang</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">No</th>
                    <th className="text-left p-3 font-medium">Nama</th>
                    <th className="text-left p-3 font-medium">Telepon</th>
                    <th className="text-right p-3 font-medium">Jumlah Hutang</th>
                  </tr>
                </thead>
                <tbody>
                  {data.debtByBuyer.map((d, idx) => (
                    <tr key={d.id} className="border-t hover:bg-muted/50 transition-colors">
                      <td className="p-3">{idx + 1}</td>
                      <td className="p-3 font-medium">{d.name}</td>
                      <td className="p-3 text-muted-foreground">{d.phone || "-"}</td>
                      <td className="p-3 text-right font-bold text-red-600">{formatRupiah(d.totalDebt)}</td>
                    </tr>
                  ))}
                  <tr className="border-t bg-muted/50 font-bold">
                    <td colSpan={3} className="p-3 text-right">Total Hutang</td>
                    <td className="p-3 text-right text-red-600">{formatRupiah(data.totalDebt)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Summary */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-[oklch(0.35_0.12_250)]">Ringkasan Transaksi</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-[oklch(0.35_0.12_250)]">{data.totalBuyers}</p>
              <p className="text-sm text-muted-foreground">Total Pembeli</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-[oklch(0.35_0.12_250)]">{data.totalProducts}</p>
              <p className="text-sm text-muted-foreground">Total Produk</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-[oklch(0.35_0.12_250)]">{data.activeDebtors}</p>
              <p className="text-sm text-muted-foreground">Pembeli Berutang</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-emerald-600">{formatRupiah(data.totalProfit)}</p>
              <p className="text-sm text-muted-foreground">Total Keuntungan</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
