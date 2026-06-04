"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

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
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", unit: "pcs", buyPrice: "", sellPrice: "", stock: "" })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const { toast } = useToast()

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products")
      const data = await res.json()
      setProducts(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Error", description: "Nama produk harus diisi", variant: "destructive" })
      return
    }
    if (Number(form.sellPrice) <= 0) {
      toast({ title: "Error", description: "Harga jual harus lebih dari 0", variant: "destructive" })
      return
    }
    try {
      const payload = {
        name: form.name,
        unit: form.unit,
        buyPrice: Number(form.buyPrice) || 0,
        sellPrice: Number(form.sellPrice) || 0,
        stock: Number(form.stock) || 0,
      }
      if (editId) {
        await fetch(`/api/products/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        toast({ title: "Berhasil", description: "Produk diperbarui" })
      } else {
        await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        toast({ title: "Berhasil", description: "Produk baru ditambahkan" })
      }
      setDialogOpen(false)
      setEditId(null)
      setForm({ name: "", unit: "pcs", buyPrice: "", sellPrice: "", stock: "" })
      fetchProducts()
    } catch (e) {
      toast({ title: "Error", description: "Gagal menyimpan", variant: "destructive" })
    }
  }

  const handleEdit = (p: Product) => {
    setEditId(p.id)
    setForm({ name: p.name, unit: p.unit, buyPrice: String(p.buyPrice), sellPrice: String(p.sellPrice), stock: String(p.stock) })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" })
      toast({ title: "Berhasil", description: "Produk dihapus" })
      fetchProducts()
    } catch (e) {
      toast({ title: "Error", description: "Gagal menghapus", variant: "destructive" })
    }
    setDeleteConfirm(null)
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <Input placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button
          onClick={() => {
            setEditId(null)
            setForm({ name: "", unit: "pcs", buyPrice: "", sellPrice: "", stock: "" })
            setDialogOpen(true)
          }}
          className="bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Tambah Produk
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse border-0 shadow-md">
              <CardContent className="p-5"><div className="h-24 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center text-muted-foreground">
            {search ? "Tidak ditemukan produk" : "Belum ada data produk"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-base">{product.name}</h3>
                  <Badge variant={product.stock <= 5 ? "destructive" : "secondary"} className="text-xs">
                    Stok: {product.stock} {product.unit}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Harga Beli:</span>
                    <span>{formatRupiah(product.buyPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Harga Jual:</span>
                    <span className="font-medium">{formatRupiah(product.sellPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Margin:</span>
                    <span className="text-emerald-600 font-medium">{formatRupiah(product.sellPrice - product.buyPrice)}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(product)} className="flex-1 text-xs h-8">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(product.id)} className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[oklch(0.35_0.12_250)]">
              {editId ? "Edit Produk" : "Tambah Produk Baru"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="pname">Nama Produk *</Label>
              <Input id="pname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Beras, Minyak, Gula..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="unit">Satuan</Label>
                <Input id="unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs, kg, liter" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stok</Label>
                <Input id="stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="buyPrice">Harga Beli (Modal)</Label>
                <Input id="buyPrice" type="number" value={form.buyPrice} onChange={(e) => setForm({ ...form, buyPrice: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellPrice">Harga Jual *</Label>
                <Input id="sellPrice" type="number" value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: e.target.value })} placeholder="0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} className="bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]">
              {editId ? "Simpan Perubahan" : "Tambah Produk"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Produk?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Data produk yang sudah dihapus tidak bisa dikembalikan.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
