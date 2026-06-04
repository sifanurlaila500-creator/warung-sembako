"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface Buyer { id: string; name: string; phone: string; totalDebt: number }
interface Transaction { id: string; buyerId: string; buyer: { name: string }; date: string; totalAmount: number; paidAmount: number; type: string; status: string; items: { product: { name: string }; quantity: number; subtotal: number }[] }
interface Payment { id: string; buyerId: string; transactionId: string | null; amount: number; date: string; notes: string; buyer: { name: string }; transaction: { buyer: { name: string }; totalAmount: number } | null }

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n)
}

export function Debts() {
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [formBuyerId, setFormBuyerId] = useState("")
  const [formTransactionId, setFormTransactionId] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      const [bRes, tRes, pRes] = await Promise.all([
        fetch("/api/buyers"),
        fetch("/api/transactions"),
        fetch("/api/payments"),
      ])
      setBuyers(await bRes.json())
      const allTx: Transaction[] = await tRes.json()
      setTransactions(allTx.filter((t) => t.type === "CREDIT" && t.status !== "PAID"))
      setPayments(await pRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handlePay = async () => {
    if (!formBuyerId) {
      toast({ title: "Error", description: "Pilih pembeli", variant: "destructive" })
      return
    }
    if (!formAmount || Number(formAmount) <= 0) {
      toast({ title: "Error", description: "Masukkan jumlah bayar", variant: "destructive" })
      return
    }
    try {
      await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: formBuyerId,
          transactionId: formTransactionId || null,
          amount: Number(formAmount),
          notes: formNotes,
        }),
      })
      toast({ title: "Berhasil", description: "Pembayaran hutang dicatat" })
      setPayDialogOpen(false)
      setFormBuyerId("")
      setFormTransactionId("")
      setFormAmount("")
      setFormNotes("")
      fetchData()
    } catch (e) {
      toast({ title: "Error", description: "Gagal menyimpan pembayaran", variant: "destructive" })
    }
  }

  const debtors = buyers.filter((b) => b.totalDebt > 0)
  const totalDebt = debtors.reduce((s, b) => s + b.totalDebt, 0)

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-red-100 text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Hutang</p>
              <p className="text-2xl font-bold text-red-600">{formatRupiah(totalDebt)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-[oklch(0.35_0.12_250)]/10 text-[oklch(0.45_0.15_250)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pembeli Berutang</p>
              <p className="text-2xl font-bold">{debtors.length} orang</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <Button
          onClick={() => { setFormBuyerId(""); setFormTransactionId(""); setFormAmount(""); setFormNotes(""); setPayDialogOpen(true) }}
          className="bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          Catat Pembayaran
        </Button>
      </div>

      {/* Debtors List */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-[oklch(0.35_0.12_250)]">Daftar Hutang Pembeli</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : debtors.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Tidak ada hutang</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {debtors.map((buyer) => (
                <div key={buyer.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div>
                    <p className="font-semibold">{buyer.name}</p>
                    {buyer.phone && <p className="text-sm text-muted-foreground">{buyer.phone}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600 text-lg">{formatRupiah(buyer.totalDebt)}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1 text-xs h-7"
                      onClick={() => {
                        setFormBuyerId(buyer.id)
                        setFormTransactionId("")
                        setFormAmount("")
                        setFormNotes("")
                        setPayDialogOpen(true)
                      }}
                    >
                      Bayar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unpaid Transactions */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-[oklch(0.35_0.12_250)]">Transaksi Belum Lunas</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Semua transaksi lunas</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{tx.buyer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}
                        {tx.items.map((i) => `${i.product.name} x${i.quantity}`).join(", ")}
                      </p>
                    </div>
                    <Badge variant={tx.status === "PARTIAL" ? "secondary" : "destructive"} className="text-xs">
                      {tx.status === "PARTIAL" ? "Sebagian" : "Belum Bayar"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="space-x-3">
                      <span className="text-muted-foreground">Total: <span className="font-medium text-foreground">{formatRupiah(tx.totalAmount)}</span></span>
                      <span className="text-muted-foreground">Dibayar: <span className="font-medium text-emerald-600">{formatRupiah(tx.paidAmount)}</span></span>
                    </div>
                    <span className="font-bold text-red-600">Kurang: {formatRupiah(tx.totalAmount - tx.paidAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-[oklch(0.35_0.12_250)]">Riwayat Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Belum ada pembayaran</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div>
                    <p className="font-medium text-sm">{p.buyer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      {p.notes && ` · ${p.notes}`}
                    </p>
                  </div>
                  <span className="font-bold text-emerald-600">{formatRupiah(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[oklch(0.35_0.12_250)]">Catat Pembayaran Hutang</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Pembeli *</Label>
              <Select value={formBuyerId} onValueChange={(v) => { setFormBuyerId(v); setFormTransactionId("") }}>
                <SelectTrigger><SelectValue placeholder="Pilih pembeli" /></SelectTrigger>
                <SelectContent>
                  {buyers.filter((b) => b.totalDebt > 0).map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} (Hutang: {formatRupiah(b.totalDebt)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formBuyerId && (
              <div className="space-y-2">
                <Label>Transaksi (Opsional)</Label>
                <Select value={formTransactionId} onValueChange={setFormTransactionId}>
                  <SelectTrigger><SelectValue placeholder="Pilih transaksi atau kosongkan" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">Umum (tanpa transaksi tertentu)</SelectItem>
                    {transactions.filter((t) => t.buyerId === formBuyerId).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {new Date(t.date).toLocaleDateString("id-ID")} - {formatRupiah(t.totalAmount)} (Kurang: {formatRupiah(t.totalAmount - t.paidAmount)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Jumlah Bayar *</Label>
              <Input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Opsional..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>Batal</Button>
            <Button onClick={handlePay} className="bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]">
              Simpan Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
