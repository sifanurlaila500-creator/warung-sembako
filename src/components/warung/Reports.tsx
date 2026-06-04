"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getClientData, exportAllData, importAllData } from "@/lib/client-store"

interface Buyer { id: string; name: string; phone: string }
interface Transaction {
  id: string; buyerId: string; date: string; totalAmount: number; paidAmount: number
  type: string; status: string; notes: string
  items: { productId: string; productName: string; quantity: number; buyPrice: number; sellPrice: number; subtotal: number }[]
}
interface Product { id: string; name: string }

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n)
}

export function Reports() {
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState("")
  const [importError, setImportError] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)

  const buyers: Buyer[] = getClientData('buyers')
  const transactions: Transaction[] = getClientData('transactions')
  const products: Product[] = getClientData('products')

  const totalSales = transactions.reduce((sum, t) => sum + t.totalAmount, 0)
  const totalPaid = transactions.reduce((sum, t) => sum + t.paidAmount, 0)
  const totalDebt = totalSales - totalPaid
  const totalCapital = transactions.reduce((sum, t) => sum + t.items.reduce((s, i) => s + i.buyPrice * i.quantity, 0), 0)
  const totalProfit = totalSales - totalCapital
  const remainingCapital = totalPaid - totalCapital
  const activeDebtors = buyers.filter((b) => {
    const debt = transactions.filter((t) => t.buyerId === b.id && t.type === 'CREDIT' && t.status !== 'PAID').reduce((s, t) => s + (t.totalAmount - t.paidAmount), 0)
    return debt > 0
  }).length

  const debtByBuyer = buyers
    .map((b) => {
      const buyerTx = transactions.filter((t) => t.buyerId === b.id && t.type === 'CREDIT' && t.status !== 'PAID')
      const debt = buyerTx.reduce((sum, t) => sum + (t.totalAmount - t.paidAmount), 0)
      return { id: b.id, name: b.name, phone: b.phone, totalDebt: debt }
    })
    .filter((b) => b.totalDebt > 0)
    .sort((a, b) => b.totalDebt - a.totalDebt)

  const totalCashSales = transactions.filter((t) => t.type === "CASH").reduce((s, t) => s + t.totalAmount, 0)
  const totalCreditSales = transactions.filter((t) => t.type === "CREDIT").reduce((s, t) => s + t.totalAmount, 0)

  const handleExport = () => {
    const data = exportAllData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `warung-sembako-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    setImportError("")
    const success = importAllData(importText)
    if (success) {
      setImportOpen(false)
      setImportText("")
      setRefreshKey((k) => k + 1)
    } else {
      setImportError("Format JSON tidak valid")
    }
  }

  return (
    <div className="space-y-6" key={refreshKey}>
      {/* Financial Summary */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="bg-[oklch(0.35_0.12_250)] p-5">
          <h2 className="text-xl font-bold text-white">Laporan Keuangan</h2>
          <p className="text-white/70 text-sm">Ringkasan keuangan warung sembako</p>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[oklch(0.35_0.12_250)]/5 border border-[oklch(0.35_0.12_250)]/10"><p className="text-sm text-muted-foreground">Total Penjualan</p><p className="text-xl font-bold text-[oklch(0.35_0.12_250)]">{formatRupiah(totalSales)}</p></div>
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100"><p className="text-sm text-muted-foreground">Uang Masuk</p><p className="text-xl font-bold text-emerald-600">{formatRupiah(totalPaid)}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-100"><p className="text-sm text-muted-foreground">Total Modal</p><p className="text-xl font-bold text-amber-600">{formatRupiah(totalCapital)}</p></div>
            <div className="p-4 rounded-lg bg-red-50 border border-red-100"><p className="text-sm text-muted-foreground">Total Hutang</p><p className="text-xl font-bold text-red-600">{formatRupiah(totalDebt)}</p></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4"><div className="p-2 rounded-lg bg-emerald-100 text-emerald-600"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg></div><h3 className="font-semibold text-base">Keuntungan</h3></div>
            <p className="text-3xl font-bold text-emerald-600">{formatRupiah(totalProfit)}</p>
            <p className="text-sm text-muted-foreground mt-1">Selisih harga jual - harga beli</p>
            <div className="mt-3 pt-3 border-t space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Penjualan Tunai</span><span>{formatRupiah(totalCashSales)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Penjualan Utang</span><span>{formatRupiah(totalCreditSales)}</span></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4"><div className={`p-2 rounded-lg ${remainingCapital >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></div><h3 className="font-semibold text-base">Sisa Modal</h3></div>
            <p className={`text-3xl font-bold ${remainingCapital >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatRupiah(remainingCapital)}</p>
            <p className="text-sm text-muted-foreground mt-1">Uang masuk - total modal keluar</p>
            <div className="mt-3 pt-3 border-t space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Uang Masuk</span><span className="text-emerald-600">{formatRupiah(totalPaid)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Modal</span><span className="text-amber-600">- {formatRupiah(totalCapital)}</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>Sisa Modal</span><span className={remainingCapital >= 0 ? "text-emerald-600" : "text-red-600"}>{formatRupiah(remainingCapital)}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3"><CardTitle className="text-lg font-semibold text-[oklch(0.35_0.12_250)]">Ringkasan Hutang per Pembeli</CardTitle></CardHeader>
        <CardContent className="px-5 pb-5">
          {debtByBuyer.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Tidak ada hutang</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted"><tr><th className="text-left p-3 font-medium">No</th><th className="text-left p-3 font-medium">Nama</th><th className="text-left p-3 font-medium">Telepon</th><th className="text-right p-3 font-medium">Jumlah Hutang</th></tr></thead>
                <tbody>
                  {debtByBuyer.map((d, idx) => (
                    <tr key={d.id} className="border-t hover:bg-muted/50 transition-colors"><td className="p-3">{idx + 1}</td><td className="p-3 font-medium">{d.name}</td><td className="p-3 text-muted-foreground">{d.phone || "-"}</td><td className="p-3 text-right font-bold text-red-600">{formatRupiah(d.totalDebt)}</td></tr>
                  ))}
                  <tr className="border-t bg-muted/50 font-bold"><td colSpan={3} className="p-3 text-right">Total Hutang</td><td className="p-3 text-right text-red-600">{formatRupiah(totalDebt)}</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3"><CardTitle className="text-lg font-semibold text-[oklch(0.35_0.12_250)]">Ringkasan Transaksi</CardTitle></CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50"><p className="text-2xl font-bold text-[oklch(0.35_0.12_250)]">{buyers.length}</p><p className="text-sm text-muted-foreground">Total Pembeli</p></div>
            <div className="text-center p-4 rounded-lg bg-muted/50"><p className="text-2xl font-bold text-[oklch(0.35_0.12_250)]">{products.length}</p><p className="text-sm text-muted-foreground">Total Produk</p></div>
            <div className="text-center p-4 rounded-lg bg-muted/50"><p className="text-2xl font-bold text-[oklch(0.35_0.12_250)]">{activeDebtors}</p><p className="text-sm text-muted-foreground">Pembeli Berutang</p></div>
            <div className="text-center p-4 rounded-lg bg-muted/50"><p className="text-2xl font-bold text-emerald-600">{formatRupiah(totalProfit)}</p><p className="text-sm text-muted-foreground">Total Keuntungan</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Backup/Restore */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3"><CardTitle className="text-lg font-semibold text-[oklch(0.35_0.12_250)]">Backup & Restore Data</CardTitle></CardHeader>
        <CardContent className="px-5 pb-5">
          <p className="text-sm text-muted-foreground mb-4">Data disimpan di browser (localStorage). Backup secara berkala untuk keamanan data.</p>
          <div className="flex gap-3">
            <Button onClick={handleExport} className="bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export Backup
            </Button>
            <Button variant="outline" onClick={() => { setImportText(""); setImportError(""); setImportOpen(true) }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Import Backup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="text-[oklch(0.35_0.12_250)]">Import Backup</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Paste JSON backup</Label>
              <textarea
                className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='Paste JSON backup di sini...'
              />
            </div>
            {importError && <p className="text-sm text-red-600">{importError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Batal</Button>
            <Button onClick={handleImport} className="bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]">Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
