"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useFetch, apiPost, apiDelete } from "@/hooks/use-api"

interface Buyer { id: string; name: string }
interface Product { id: string; name: string; unit: string; buyPrice: number; sellPrice: number; stock: number }
interface TransactionItem {
  productId: string
  productName: string
  quantity: number
  buyPrice: number
  sellPrice: number
  subtotal: number
}

interface Transaction {
  id: string
  buyerId: string
  buyer: { name: string }
  date: string
  totalAmount: number
  paidAmount: number
  type: string
  status: string
  notes: string
  items: TransactionItem[]
  createdAt: string
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n)
}

export function Transactions() {
  const { toast } = useToast()
  const { data: transactions, loading: txLoading, refetch: refetchTx } = useFetch<Transaction[]>("/api/transactions")
  const { data: buyers, loading: buyersLoading } = useFetch<Buyer[]>("/api/buyers")
  const { data: products, loading: productsLoading, refetch: refetchProducts } = useFetch<Product[]>("/api/products")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [saving, setSaving] = useState(false)

  const [formBuyerId, setFormBuyerId] = useState("")
  const [formType, setFormType] = useState("CASH")
  const [formPaidAmount, setFormPaidAmount] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0])
  const [cartItems, setCartItems] = useState<TransactionItem[]>([])
  const [addProductId, setAddProductId] = useState("")
  const [addQty, setAddQty] = useState("1")
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("ALL")

  const loading = txLoading || buyersLoading || productsLoading

  const handleAddToCart = () => {
    const product = (products || []).find((p) => p.id === addProductId)
    if (!product) return
    const qty = Number(addQty) || 0
    if (qty <= 0) {
      toast({ title: "Error", description: "Jumlah harus lebih dari 0", variant: "destructive" })
      return
    }
    if (qty > product.stock) {
      toast({ title: "Error", description: `Stok tidak cukup (tersedia: ${product.stock})`, variant: "destructive" })
      return
    }
    const existing = cartItems.find((i) => i.productId === product.id)
    if (existing) {
      setCartItems(
        cartItems.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + qty, subtotal: (i.quantity + qty) * i.sellPrice }
            : i
        )
      )
    } else {
      setCartItems([
        ...cartItems,
        { productId: product.id, productName: product.name, quantity: qty, buyPrice: product.buyPrice, sellPrice: product.sellPrice, subtotal: qty * product.sellPrice },
      ])
    }
    setAddProductId("")
    setAddQty("1")
  }

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(cartItems.filter((i) => i.productId !== productId))
  }

  const handleSaveTransaction = async () => {
    if (!formBuyerId) {
      toast({ title: "Error", description: "Pilih pembeli terlebih dahulu", variant: "destructive" })
      return
    }
    if (cartItems.length === 0) {
      toast({ title: "Error", description: "Tambahkan barang ke keranjang", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const totalAmount = cartItems.reduce((s, i) => s + i.subtotal, 0)
      const paidAmount = formType === "CASH" ? totalAmount : (Number(formPaidAmount) || 0)

      await apiPost("/api/transactions", {
        buyerId: formBuyerId,
        type: formType,
        paidAmount,
        notes: formNotes,
        date: formDate,
        items: cartItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      })

      await refetchTx()
      await refetchProducts()

      toast({ title: "Berhasil", description: "Transaksi berhasil disimpan" })
      setDialogOpen(false)
      resetForm()
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Gagal menyimpan transaksi", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTransaction = async () => {
    if (!selectedTx) return
    setSaving(true)
    try {
      await apiDelete(`/api/transactions/${selectedTx.id}`)
      await refetchTx()
      await refetchProducts()
      setDeleteDialogOpen(false)
      setDetailOpen(false)
      toast({ title: "Berhasil", description: "Transaksi berhasil dihapus" })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Gagal menghapus transaksi", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormBuyerId("")
    setFormType("CASH")
    setFormPaidAmount("")
    setFormNotes("")
    setFormDate(new Date().toISOString().split("T")[0])
    setCartItems([])
    setAddProductId("")
    setAddQty("1")
  }

  const totalAmount = cartItems.reduce((s, i) => s + i.subtotal, 0)

  const filteredTransactions = (transactions || []).filter((t) => {
    const matchSearch = (t.buyer?.name || '').toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === "ALL" || t.type === filterType
    return matchSearch && matchType
  })

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-0 shadow-md"><CardContent className="p-5"><div className="animate-pulse space-y-2"><div className="h-5 bg-muted rounded w-32" /><div className="h-4 bg-muted rounded w-48" /></div></CardContent></Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <Input placeholder="Cari transaksi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              <SelectItem value="CASH">Tunai</SelectItem>
              <SelectItem value="CREDIT">Utang</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true) }} className="bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Transaksi Baru
        </Button>
      </div>

      {filteredTransactions.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center text-muted-foreground">
            {search || filterType !== "ALL" ? "Tidak ditemukan transaksi" : "Belum ada transaksi"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {filteredTransactions.map((tx) => (
            <Card
              key={tx.id}
              className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => { setSelectedTx(tx); setDetailOpen(true) }}
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{tx.buyer?.name || 'Unknown'}</h3>
                      <Badge variant={tx.type === "CASH" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                        {tx.type === "CASH" ? "Tunai" : "Utang"}
                      </Badge>
                      <Badge
                        variant={tx.status === "PAID" ? "default" : tx.status === "PARTIAL" ? "secondary" : "destructive"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {tx.status === "PAID" ? "Lunas" : tx.status === "PARTIAL" ? "Sebagian" : "Belum Bayar"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}{tx.items.length} item
                      {tx.notes && ` · ${tx.notes}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatRupiah(tx.totalAmount)}</p>
                    {tx.type === "CREDIT" && tx.status !== "PAID" && (
                      <p className="text-xs text-red-600">Kurang: {formatRupiah(tx.totalAmount - tx.paidAmount)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Transaction Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[oklch(0.35_0.12_250)]">Transaksi Baru</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Pembeli *</Label>
                <Select value={formBuyerId} onValueChange={setFormBuyerId}>
                  <SelectTrigger><SelectValue placeholder="Pilih pembeli" /></SelectTrigger>
                  <SelectContent>
                    {(buyers || []).map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jenis Bayar</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Tunai</SelectItem>
                    <SelectItem value="CREDIT">Utang</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </div>
            {formType === "CREDIT" && (
              <div className="space-y-2">
                <Label>Uang Dibayar Sekarang</Label>
                <Input type="number" value={formPaidAmount} onChange={(e) => setFormPaidAmount(e.target.value)} placeholder="0" />
              </div>
            )}
            <div className="space-y-2"><Label>Catatan</Label><Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Opsional..." /></div>
            <div className="border rounded-lg p-4 space-y-3">
              <Label className="text-sm font-semibold">Tambah Barang</Label>
              <div className="flex gap-2">
                <Select value={addProductId} onValueChange={setAddProductId}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Pilih produk" /></SelectTrigger>
                  <SelectContent>
                    {(products || []).filter((p) => p.stock > 0).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} (Stok: {p.stock} {p.unit}) - {formatRupiah(p.sellPrice)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" value={addQty} onChange={(e) => setAddQty(e.target.value)} className="w-20" min="1" />
                <Button type="button" onClick={handleAddToCart} size="sm" className="bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                </Button>
              </div>
            </div>
            {cartItems.length > 0 && (
              <div className="border rounded-lg p-4 space-y-2">
                <Label className="text-sm font-semibold">Keranjang</Label>
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex justify-between items-center text-sm py-1.5 border-b last:border-0">
                    <div>
                      <span className="font-medium">{item.productName}</span>
                      <span className="text-muted-foreground ml-2">x{item.quantity} @ {formatRupiah(item.sellPrice)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatRupiah(item.subtotal)}</span>
                      <button onClick={() => handleRemoveFromCart(item.productId)} className="text-red-500 hover:text-red-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t font-bold text-base">
                  <span>Total</span><span>{formatRupiah(totalAmount)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveTransaction} disabled={saving} className="bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]">{saving ? "Menyimpan..." : "Simpan Transaksi"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Detail */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-[oklch(0.35_0.12_250)]">Detail Transaksi</DialogTitle></DialogHeader>
          {selectedTx && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-lg">{selectedTx.buyer?.name || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedTx.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Badge variant={selectedTx.type === "CASH" ? "default" : "secondary"}>{selectedTx.type === "CASH" ? "Tunai" : "Utang"}</Badge>
                  <Badge variant={selectedTx.status === "PAID" ? "default" : selectedTx.status === "PARTIAL" ? "secondary" : "destructive"}>
                    {selectedTx.status === "PAID" ? "Lunas" : selectedTx.status === "PARTIAL" ? "Sebagian" : "Belum Bayar"}
                  </Badge>
                </div>
              </div>
              {selectedTx.items.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted"><tr><th className="text-left p-2.5">Barang</th><th className="text-center p-2.5">Qty</th><th className="text-right p-2.5">Harga</th><th className="text-right p-2.5">Subtotal</th></tr></thead>
                    <tbody>
                      {selectedTx.items.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2.5">{item.productName}</td>
                          <td className="text-center p-2.5">{item.quantity}</td>
                          <td className="text-right p-2.5">{formatRupiah(item.sellPrice)}</td>
                          <td className="text-right p-2.5">{formatRupiah(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold">{formatRupiah(selectedTx.totalAmount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Dibayar</span><span>{formatRupiah(selectedTx.paidAmount)}</span></div>
                {selectedTx.totalAmount - selectedTx.paidAmount > 0 && (
                  <div className="flex justify-between"><span className="text-red-600 font-medium">Sisa Hutang</span><span className="text-red-600 font-bold">{formatRupiah(selectedTx.totalAmount - selectedTx.paidAmount)}</span></div>
                )}
              </div>
              {selectedTx.notes && <div className="text-sm text-muted-foreground border-t pt-2">Catatan: {selectedTx.notes}</div>}

              {/* Delete button */}
              <div className="border-t pt-3">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  Hapus Transaksi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-red-600">Hapus Transaksi</DialogTitle></DialogHeader>
          <div className="py-4">
            <p className="mb-2">Yakin ingin menghapus transaksi ini?</p>
            {selectedTx && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm space-y-1">
                <p><span className="text-muted-foreground">Pembeli:</span> <strong>{selectedTx.buyer?.name || 'Unknown'}</strong></p>
                <p><span className="text-muted-foreground">Total:</span> <strong>{formatRupiah(selectedTx.totalAmount)}</strong></p>
                <p><span className="text-muted-foreground">Tanggal:</span> {new Date(selectedTx.date).toLocaleDateString("id-ID")}</p>
                <p className="text-red-600 font-medium mt-2">Stok barang akan dikembalikan jika transaksi dihapus.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
            <Button onClick={handleDeleteTransaction} disabled={saving} className="bg-red-600 hover:bg-red-700">{saving ? "Menghapus..." : "Ya, Hapus"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
