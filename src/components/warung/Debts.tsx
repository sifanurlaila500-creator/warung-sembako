"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useFetch, apiPost, apiDelete } from "@/hooks/use-api"

interface Buyer { id: string; name: string; phone: string; totalDebt: number }
interface Transaction {
  id: string; buyerId: string; date: string; totalAmount: number; paidAmount: number
  type: string; status: string; notes: string
  items: { productId: string; productName: string; quantity: number; sellPrice: number; subtotal: number }[]
  buyer?: { name: string }
}
interface Payment { id: string; buyerId: string; amount: number; date: string; notes: string; buyer?: { name: string } }

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n)
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
}
function getTodayStr() { return new Date().toISOString().split("T")[0] }

type LedgerEntry = {
  date: string
  type: "DEBT" | "PAYMENT"
  description: string
  amount: number
  runningDebt: number
  id: string // transaction id or payment id
}

export function Debts() {
  const { toast } = useToast()
  const { data: buyers, loading: buyersLoading, refetch: refetchBuyers } = useFetch<Buyer[]>("/api/buyers")
  const { data: transactions, loading: txLoading, refetch: refetchTx } = useFetch<Transaction[]>("/api/transactions")
  const { data: payments, loading: payLoading, refetch: refetchPay } = useFetch<Payment[]>("/api/payments")

  const [search, setSearch] = useState("")
  const [expandedBuyer, setExpandedBuyer] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [payBuyerId, setPayBuyerId] = useState("")
  const [payAmount, setPayAmount] = useState("")
  const [payDate, setPayDate] = useState(getTodayStr())
  const [payNotes, setPayNotes] = useState("")

  const [debtDialogOpen, setDebtDialogOpen] = useState(false)
  const [debtBuyerId, setDebtBuyerId] = useState("")
  const [debtDate, setDebtDate] = useState(getTodayStr())
  const [debtDesc, setDebtDesc] = useState("")
  const [debtAmount, setDebtAmount] = useState("")

  // Delete dialogs
  const [deleteTxDialogOpen, setDeleteTxDialogOpen] = useState(false)
  const [deletePayDialogOpen, setDeletePayDialogOpen] = useState(false)
  const [deleteEntry, setDeleteEntry] = useState<LedgerEntry | null>(null)

  const loading = buyersLoading || txLoading || payLoading

  const refreshAll = async () => {
    await Promise.all([refetchBuyers(), refetchTx(), refetchPay()])
  }

  // Buyers with debt
  const buyersWithDebt = (buyers || []).map((b) => {
    const buyerTx = (transactions || []).filter((t) => t.buyerId === b.id && t.type === 'CREDIT')
    const totalDebt = buyerTx.reduce((sum, t) => sum + (t.totalAmount - t.paidAmount), 0)
    return { ...b, totalDebt }
  })

  const handlePay = async () => {
    if (!payBuyerId) { toast({ title: "Error", description: "Pilih pembeli", variant: "destructive" }); return }
    if (!payAmount || Number(payAmount) <= 0) { toast({ title: "Error", description: "Masukkan jumlah bayar", variant: "destructive" }); return }

    setSaving(true)
    try {
      await apiPost("/api/payments", {
        buyerId: payBuyerId,
        amount: Number(payAmount),
        date: payDate,
        notes: payNotes,
      })
      await refreshAll()
      toast({ title: "Berhasil", description: "Pembayaran dicatat" })
      setPayDialogOpen(false)
      setPayBuyerId(""); setPayAmount(""); setPayDate(getTodayStr()); setPayNotes("")
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Gagal", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleAddDebt = async () => {
    if (!debtBuyerId) { toast({ title: "Error", description: "Pilih pembeli", variant: "destructive" }); return }
    if (!debtAmount || Number(debtAmount) <= 0) { toast({ title: "Error", description: "Masukkan jumlah hutang", variant: "destructive" }); return }

    setSaving(true)
    try {
      await apiPost("/api/transactions", {
        buyerId: debtBuyerId,
        type: 'CREDIT',
        totalOverride: Number(debtAmount),
        notes: debtDesc || 'Hutang baru',
        date: debtDate,
      })
      await refreshAll()
      toast({ title: "Berhasil", description: "Hutang baru dicatat" })
      setDebtDialogOpen(false)
      setDebtBuyerId(""); setDebtDate(getTodayStr()); setDebtDesc(""); setDebtAmount("")
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Gagal", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEntry = async () => {
    if (!deleteEntry) return
    setSaving(true)
    try {
      if (deleteEntry.type === "DEBT") {
        await apiDelete(`/api/transactions/${deleteEntry.id}`)
        toast({ title: "Berhasil", description: "Hutang berhasil dihapus" })
      } else {
        await apiDelete(`/api/payments/${deleteEntry.id}`)
        toast({ title: "Berhasil", description: "Pembayaran berhasil dihapus" })
      }
      await refreshAll()
      if (deleteEntry.type === "DEBT") {
        setDeleteTxDialogOpen(false)
      } else {
        setDeletePayDialogOpen(false)
      }
      setDeleteEntry(null)
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Gagal menghapus", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const debtors = buyersWithDebt.filter((b) => b.totalDebt > 0)
  const filteredDebtors = debtors.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) || (d.phone || "").includes(search)
  )
  const totalDebt = debtors.reduce((s, b) => s + b.totalDebt, 0)

  const buildLedger = (buyerId: string): LedgerEntry[] => {
    const entries: LedgerEntry[] = []
    const buyerTx = (transactions || []).filter((t) => t.buyerId === buyerId && t.type === "CREDIT")
    const buyerPay = (payments || []).filter((p) => p.buyerId === buyerId)

    for (const tx of buyerTx) {
      const desc = tx.items.length > 0
        ? tx.items.map((i) => `${i.productName} x${i.quantity}`).join(", ")
        : tx.notes || "Hutang"
      entries.push({ date: tx.date, type: "DEBT", description: desc, amount: tx.totalAmount, runningDebt: 0, id: tx.id })
    }
    for (const p of buyerPay) {
      entries.push({ date: p.date, type: "PAYMENT", description: p.notes || "Bayar hutang", amount: p.amount, runningDebt: 0, id: p.id })
    }

    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    let running = 0
    for (const e of entries) {
      if (e.type === "DEBT") running += e.amount
      else running -= e.amount
      e.runningDebt = Math.max(running, 0)
    }
    return entries
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="border-0 shadow-md"><CardContent className="p-5"><div className="animate-pulse space-y-2"><div className="h-4 bg-muted rounded w-24" /><div className="h-8 bg-muted rounded w-32" /></div></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-red-100 text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div><p className="text-sm text-muted-foreground">Total Hutang</p><p className="text-2xl font-bold text-red-600">{formatRupiah(totalDebt)}</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-[oklch(0.35_0.12_250)]/10 text-[oklch(0.45_0.15_250)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div><p className="text-sm text-muted-foreground">Pembeli Berutang</p><p className="text-2xl font-bold">{debtors.length} orang</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <Input placeholder="Cari nama pembeli..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setDebtBuyerId(""); setDebtDate(getTodayStr()); setDebtDesc(""); setDebtAmount(""); setDebtDialogOpen(true) }} className="bg-red-600 hover:bg-red-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
            Tambah Hutang
          </Button>
          <Button onClick={() => { setPayBuyerId(""); setPayAmount(""); setPayDate(getTodayStr()); setPayNotes(""); setPayDialogOpen(true) }} className="bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="22" y2="10"/></svg>
            Catat Bayar
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3"><CardTitle className="text-lg font-semibold text-[oklch(0.35_0.12_250)]">Hutang per Orang</CardTitle></CardHeader>
        <CardContent className="px-5 pb-5">
          {filteredDebtors.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">{search ? "Tidak ditemukan" : "Tidak ada hutang"}</p>
          ) : (
            <div className="space-y-2">
              {filteredDebtors.map((buyer) => {
                const isExpanded = expandedBuyer === buyer.id
                const ledger = buildLedger(buyer.id)
                return (
                  <div key={buyer.id} className="rounded-lg border bg-white overflow-hidden">
                    <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setExpandedBuyer(isExpanded ? null : buyer.id)}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm shrink-0">{buyer.name.charAt(0).toUpperCase()}</div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{buyer.name}</p>
                          <p className="text-xs text-muted-foreground">{ledger.length} transaksi</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right"><p className="font-bold text-red-600">{formatRupiah(buyer.totalDebt)}</p></div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50"><tr>
                              <th className="text-left p-2.5 font-medium text-muted-foreground">Tanggal</th>
                              <th className="text-left p-2.5 font-medium text-muted-foreground">Keterangan</th>
                              <th className="text-right p-2.5 font-medium text-muted-foreground">Hutang (+)</th>
                              <th className="text-right p-2.5 font-medium text-muted-foreground">Bayar (-)</th>
                              <th className="text-right p-2.5 font-medium text-muted-foreground">Sisa</th>
                              <th className="text-center p-2.5 font-medium text-muted-foreground">Aksi</th>
                            </tr></thead>
                            <tbody>
                              {ledger.map((entry, idx) => (
                                <tr key={idx} className={`border-t ${entry.type === "PAYMENT" ? "bg-emerald-50/50" : ""}`}>
                                  <td className="p-2.5 whitespace-nowrap text-xs"><span className="font-medium">{formatDate(entry.date)}</span></td>
                                  <td className="p-2.5"><span className={entry.type === "PAYMENT" ? "text-emerald-700" : "text-foreground"}>{entry.type === "PAYMENT" ? "💰 " : "🛒 "}{entry.description}</span></td>
                                  <td className="p-2.5 text-right">{entry.type === "DEBT" ? <span className="font-medium text-red-600">+{formatRupiah(entry.amount)}</span> : <span className="text-muted-foreground">-</span>}</td>
                                  <td className="p-2.5 text-right">{entry.type === "PAYMENT" ? <span className="font-medium text-emerald-600">-{formatRupiah(entry.amount)}</span> : <span className="text-muted-foreground">-</span>}</td>
                                  <td className="p-2.5 text-right font-semibold"><span className={entry.runningDebt > 0 ? "text-red-600" : "text-emerald-600"}>{formatRupiah(entry.runningDebt)}</span></td>
                                  <td className="p-2.5 text-center">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setDeleteEntry(entry)
                                        if (entry.type === "DEBT") setDeleteTxDialogOpen(true)
                                        else setDeletePayDialogOpen(true)
                                      }}
                                      className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                                      title={entry.type === "DEBT" ? "Hapus hutang" : "Hapus pembayaran"}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                              {ledger.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Belum ada riwayat</td></tr>}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex gap-2 p-3 bg-muted/20 border-t">
                          <Button size="sm" className="text-xs h-8 bg-red-600 hover:bg-red-700" onClick={(e) => { e.stopPropagation(); setDebtBuyerId(buyer.id); setDebtDate(getTodayStr()); setDebtDesc(""); setDebtAmount(""); setDebtDialogOpen(true) }}>+ Hutang Baru</Button>
                          <Button size="sm" className="text-xs h-8 bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]" onClick={(e) => { e.stopPropagation(); setPayBuyerId(buyer.id); setPayAmount(""); setPayDate(getTodayStr()); setPayNotes(""); setPayDialogOpen(true) }}>Bayar</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Debt Dialog */}
      <Dialog open={debtDialogOpen} onOpenChange={setDebtDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-red-600">Tambah Hutang Baru</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Pembeli *</Label><select value={debtBuyerId} onChange={(e) => setDebtBuyerId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Pilih pembeli</option>{buyersWithDebt.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}</select></div>
            <div className="space-y-2"><Label>Tanggal *</Label><Input type="date" value={debtDate} onChange={(e) => setDebtDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Keterangan *</Label><Input value={debtDesc} onChange={(e) => setDebtDesc(e.target.value)} placeholder="Contoh: 2kg beras, 1 minyak..." /></div>
            <div className="space-y-2"><Label>Total Hutang (Rp) *</Label><Input type="number" value={debtAmount} onChange={(e) => setDebtAmount(e.target.value)} placeholder="0" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDebtDialogOpen(false)}>Batal</Button><Button onClick={handleAddDebt} disabled={saving} className="bg-red-600 hover:bg-red-700">{saving ? "Menyimpan..." : "Simpan Hutang"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-[oklch(0.35_0.12_250)]">Catat Pembayaran</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Pembeli *</Label><select value={payBuyerId} onChange={(e) => setPayBuyerId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Pilih pembeli</option>{debtors.map((b) => (<option key={b.id} value={b.id}>{b.name} — Hutang: {formatRupiah(b.totalDebt)}</option>))}</select></div>
            {payBuyerId && (<div className="p-3 rounded-lg bg-muted/50 text-sm"><span className="text-muted-foreground">Sisa hutang:</span> <span className="font-bold text-red-600">{formatRupiah(debtors.find((b) => b.id === payBuyerId)?.totalDebt || 0)}</span></div>)}
            <div className="space-y-2"><Label>Tanggal *</Label><Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Jumlah Bayar (Rp) *</Label><Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0" /></div>
            <div className="space-y-2"><Label>Catatan</Label><Input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Opsional..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPayDialogOpen(false)}>Batal</Button><Button onClick={handlePay} disabled={saving} className="bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]">{saving ? "Menyimpan..." : "Simpan Pembayaran"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Transaction (Debt) Dialog */}
      <Dialog open={deleteTxDialogOpen} onOpenChange={setDeleteTxDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-red-600">Hapus Hutang</DialogTitle></DialogHeader>
          <div className="py-4">
            <p className="mb-2">Yakin ingin menghapus hutang ini?</p>
            {deleteEntry && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm space-y-1">
                <p><span className="text-muted-foreground">Keterangan:</span> <strong>{deleteEntry.description}</strong></p>
                <p><span className="text-muted-foreground">Jumlah:</span> <strong className="text-red-600">{formatRupiah(deleteEntry.amount)}</strong></p>
                <p><span className="text-muted-foreground">Tanggal:</span> {formatDate(deleteEntry.date)}</p>
                <p className="text-red-600 font-medium mt-2">Jika hutang ini dari transaksi barang, stok akan dikembalikan.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteTxDialogOpen(false); setDeleteEntry(null) }}>Batal</Button>
            <Button onClick={handleDeleteEntry} disabled={saving} className="bg-red-600 hover:bg-red-700">{saving ? "Menghapus..." : "Ya, Hapus"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Dialog */}
      <Dialog open={deletePayDialogOpen} onOpenChange={setDeletePayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-red-600">Hapus Pembayaran</DialogTitle></DialogHeader>
          <div className="py-4">
            <p className="mb-2">Yakin ingin menghapus pembayaran ini?</p>
            {deleteEntry && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm space-y-1">
                <p><span className="text-muted-foreground">Keterangan:</span> <strong>{deleteEntry.description}</strong></p>
                <p><span className="text-muted-foreground">Jumlah:</span> <strong className="text-red-600">{formatRupiah(deleteEntry.amount)}</strong></p>
                <p><span className="text-muted-foreground">Tanggal:</span> {formatDate(deleteEntry.date)}</p>
                <p className="text-red-600 font-medium mt-2">Menghapus pembayaran akan mengembalikan sisa hutang pembeli.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeletePayDialogOpen(false); setDeleteEntry(null) }}>Batal</Button>
            <Button onClick={handleDeleteEntry} disabled={saving} className="bg-red-600 hover:bg-red-700">{saving ? "Menghapus..." : "Ya, Hapus"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
