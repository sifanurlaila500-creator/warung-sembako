"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface Buyer { id: string; name: string; phone: string; totalDebt: number }
interface Payment { id: string; buyerId: string; amount: number; date: string; notes: string; buyer: { name: string } }

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n)
}

export function Debts() {
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [formBuyerId, setFormBuyerId] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [search, setSearch] = useState("")
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      const [bRes, pRes] = await Promise.all([
        fetch("/api/buyers"),
        fetch("/api/payments"),
      ])
      setBuyers(await bRes.json())
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
          amount: Number(formAmount),
          notes: formNotes,
        }),
      })
      toast({ title: "Berhasil", description: "Pembayaran hutang dicatat" })
      setPayDialogOpen(false)
      setFormBuyerId("")
      setFormAmount("")
      setFormNotes("")
      fetchData()
    } catch (e) {
      toast({ title: "Error", description: "Gagal menyimpan pembayaran", variant: "destructive" })
    }
  }

  const debtors = buyers.filter((b) => b.totalDebt > 0)
  const filteredDebtors = debtors.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.phone.includes(search)
  )
  const totalDebt = debtors.reduce((s, b) => s + b.totalDebt, 0)

  // Group payments by buyer
  const paymentsByBuyer = payments.reduce<Record<string, Payment[]>>((acc, p) => {
    if (!acc[p.buyerId]) acc[p.buyerId] = []
    acc[p.buyerId].push(p)
    return acc
  }, {})

  const [expandedBuyer, setExpandedBuyer] = useState<string | null>(null)

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

      {/* Search & Add */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <Input placeholder="Cari nama pembeli..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button
          onClick={() => { setFormBuyerId(""); setFormAmount(""); setFormNotes(""); setPayDialogOpen(true) }}
          className="bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          Catat Pembayaran
        </Button>
      </div>

      {/* Debtors List - Per Person */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-[oklch(0.35_0.12_250)]">Hutang per Orang</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filteredDebtors.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              {search ? "Tidak ditemukan" : "Tidak ada hutang 🎉"}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredDebtors.map((buyer) => {
                const isExpanded = expandedBuyer === buyer.id
                const buyerPayments = paymentsByBuyer[buyer.id] || []

                return (
                  <div key={buyer.id} className="rounded-lg border bg-white overflow-hidden">
                    {/* Main Row */}
                    <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm shrink-0">
                          {buyer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{buyer.name}</p>
                          {buyer.phone && <p className="text-xs text-muted-foreground">{buyer.phone}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-red-600">{formatRupiah(buyer.totalDebt)}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            className="text-xs h-8 bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]"
                            onClick={() => {
                              setFormBuyerId(buyer.id)
                              setFormAmount("")
                              setFormNotes("")
                              setPayDialogOpen(true)
                            }}
                          >
                            Bayar
                          </Button>
                          {buyerPayments.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 px-2"
                              onClick={() => setExpandedBuyer(isExpanded ? null : buyer.id)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              >
                                <path d="m6 9 6 6 6-6"/>
                              </svg>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded: Payment History for this buyer */}
                    {isExpanded && buyerPayments.length > 0 && (
                      <div className="border-t bg-muted/20 px-4 py-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Riwayat Bayar:</p>
                        {buyerPayments.map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-sm py-1">
                            <div className="text-muted-foreground">
                              {new Date(p.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                              {p.notes && <span className="ml-1">· {p.notes}</span>}
                            </div>
                            <span className="font-medium text-emerald-600">+{formatRupiah(p.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
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
              <select
                value={formBuyerId}
                onChange={(e) => setFormBuyerId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Pilih pembeli</option>
                {debtors.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} — Hutang: {formatRupiah(b.totalDebt)}
                  </option>
                ))}
              </select>
            </div>
            {formBuyerId && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <span className="text-muted-foreground">Sisa hutang:</span>{" "}
                <span className="font-bold text-red-600">
                  {formatRupiah(debtors.find((b) => b.id === formBuyerId)?.totalDebt || 0)}
                </span>
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
