"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useFetch, apiPost, apiPut, apiDelete } from "@/hooks/use-api"

interface Product {
  id: string
  name: string
  unit: string
  buyPrice: number
  sellPrice: number
  stock: number
  createdAt: string
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n)
}

export function Products() {
  const { toast } = useToast()
  const { data: products, loading, refetch } = useFetch<Product[]>("/api/products")
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  const [formName, setFormName] = useState("")
  const [formUnit, setFormUnit] = useState("pcs")
  const [formBuyPrice, setFormBuyPrice] = useState("")
  const [formSellPrice, setFormSellPrice] = useState("")
  const [formStock, setFormStock] = useState("0")

  const filteredProducts = (products || []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async () => {
    if (!formName.trim() || !formSellPrice) {
      toast({ title: "Error", description: "Nama dan harga jual wajib diisi", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      await apiPost("/api/products", {
        name: formName.trim(),
        unit: formUnit || 'pcs',
        buyPrice: Number(formBuyPrice) || 0,
        sellPrice: Number(formSellPrice) || 0,
        stock: Number(formStock) || 0,
      })
      await refetch()
      setDialogOpen(false)
      setFormName(""); setFormUnit("pcs"); setFormBuyPrice(""); setFormSellPrice(""); setFormStock("0")
      toast({ title: "Berhasil", description: "Produk baru ditambahkan" })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Gagal", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedProduct) return
    setSaving(true)
    try {
      await apiPut(`/api/products/${selectedProduct.id}`, {
        name: formName.trim(),
        unit: formUnit || 'pcs',
        buyPrice: Number(formBuyPrice) || 0,
        sellPrice: Number(formSellPrice) || 0,
        stock: Number(formStock) || 0,
      })
      await refetch()
      setEditDialogOpen(false)
      toast({ title: "Berhasil", description: "Produk diperbarui" })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Gagal", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedProduct) return
    setSaving(true)
    try {
      await apiDelete(`/api/products/${selectedProduct.id}`)
      await refetch()
      setDeleteDialogOpen(false)
      toast({ title: "Berhasil", description: "Produk dihapus" })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Gagal", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="border-0 shadow-md"><CardContent className="p-4"><div className="animate-pulse space-y-3"><div className="h-5 bg-muted rounded w-24" /><div className="h-4 bg-muted rounded w-16" /></div></CardContent></Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <Input placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => { setFormName(""); setFormUnit("pcs"); setFormBuyPrice(""); setFormSellPrice(""); setFormStock("0"); setDialogOpen(true) }} className="bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
          Tambah Produk
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">{(products || []).length} produk terdaftar</div>

      {filteredProducts.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center text-muted-foreground">
            {search ? "Tidak ditemukan" : "Belum ada produk"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-sm">{product.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => { setSelectedProduct(product); setFormName(product.name); setFormUnit(product.unit); setFormBuyPrice(String(product.buyPrice)); setFormSellPrice(String(product.sellPrice)); setFormStock(String(product.stock)); setEditDialogOpen(true) }} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </button>
                    <button onClick={() => { setSelectedProduct(product); setDeleteDialogOpen(true) }} className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stok</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{product.stock} {product.unit}</span>
                      {product.stock <= 5 && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Stok Rendah</Badge>}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Harga Beli</span>
                    <span>{formatRupiah(product.buyPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Harga Jual</span>
                    <span className="font-medium">{formatRupiah(product.sellPrice)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Margin</span>
                    <span className="font-medium text-emerald-600">{formatRupiah(product.sellPrice - product.buyPrice)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-[oklch(0.35_0.12_250)]">Tambah Produk Baru</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Nama Produk *</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nama produk" /></div>
            <div className="space-y-2"><Label>Satuan</Label><Input value={formUnit} onChange={(e) => setFormUnit(e.target.value)} placeholder="pcs, kg, liter..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Stok</Label><Input type="number" value={formStock} onChange={(e) => setFormStock(e.target.value)} /></div>
              <div className="space-y-2"><Label>Harga Beli (Modal)</Label><Input type="number" value={formBuyPrice} onChange={(e) => setFormBuyPrice(e.target.value)} placeholder="0" /></div>
            </div>
            <div className="space-y-2"><Label>Harga Jual *</Label><Input type="number" value={formSellPrice} onChange={(e) => setFormSellPrice(e.target.value)} placeholder="0" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleAdd} disabled={saving} className="bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]">{saving ? "Menyimpan..." : "Tambah Produk"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-[oklch(0.35_0.12_250)]">Edit Produk</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Nama Produk *</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Satuan</Label><Input value={formUnit} onChange={(e) => setFormUnit(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Stok</Label><Input type="number" value={formStock} onChange={(e) => setFormStock(e.target.value)} /></div>
              <div className="space-y-2"><Label>Harga Beli (Modal)</Label><Input type="number" value={formBuyPrice} onChange={(e) => setFormBuyPrice(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Harga Jual *</Label><Input type="number" value={formSellPrice} onChange={(e) => setFormSellPrice(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Batal</Button>
            <Button onClick={handleEdit} disabled={saving} className="bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]">{saving ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-red-600">Hapus Produk</DialogTitle></DialogHeader>
          <p className="py-4">Yakin ingin menghapus <strong>{selectedProduct?.name}</strong>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
            <Button onClick={handleDelete} disabled={saving} className="bg-red-600 hover:bg-red-700">{saving ? "Menghapus..." : "Hapus"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
