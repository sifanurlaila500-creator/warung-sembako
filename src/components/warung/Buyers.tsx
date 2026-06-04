"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface Buyer {
  id: string
  name: string
  phone: string
  address: string
  totalDebt: number
  createdAt: string
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n)
}

export function Buyers() {
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", phone: "", address: "" })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const { toast } = useToast()

  const fetchBuyers = useCallback(async () => {
    try {
      const res = await fetch("/api/buyers")
      const data = await res.json()
      setBuyers(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBuyers() }, [fetchBuyers])

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Error", description: "Nama pembeli harus diisi", variant: "destructive" })
      return
    }
    try {
      if (editId) {
        await fetch(`/api/buyers/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        toast({ title: "Berhasil", description: "Data pembeli diperbarui" })
      } else {
        await fetch("/api/buyers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        toast({ title: "Berhasil", description: "Pembeli baru ditambahkan" })
      }
      setDialogOpen(false)
      setEditId(null)
      setForm({ name: "", phone: "", address: "" })
      fetchBuyers()
    } catch (e) {
      toast({ title: "Error", description: "Gagal menyimpan data", variant: "destructive" })
    }
  }

  const handleEdit = (buyer: Buyer) => {
    setEditId(buyer.id)
    setForm({ name: buyer.name, phone: buyer.phone, address: buyer.address })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/buyers/${id}`, { method: "DELETE" })
      toast({ title: "Berhasil", description: "Pembeli dihapus" })
      fetchBuyers()
    } catch (e) {
      toast({ title: "Error", description: "Gagal menghapus", variant: "destructive" })
    }
    setDeleteConfirm(null)
  }

  const filteredBuyers = buyers.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.phone.includes(search)
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <Input
            placeholder="Cari pembeli..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => {
            setEditId(null)
            setForm({ name: "", phone: "", address: "" })
            setDialogOpen(true)
          }}
          className="bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Tambah Pembeli
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse border-0 shadow-md">
              <CardContent className="p-5"><div className="h-20 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : filteredBuyers.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center text-muted-foreground">
            {search ? "Tidak ditemukan pembeli" : "Belum ada data pembeli"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBuyers.map((buyer) => (
            <Card key={buyer.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-base">{buyer.name}</h3>
                    {buyer.phone && <p className="text-sm text-muted-foreground">{buyer.phone}</p>}
                    {buyer.address && <p className="text-xs text-muted-foreground mt-0.5">{buyer.address}</p>}
                  </div>
                  {buyer.totalDebt > 0 ? (
                    <Badge variant="destructive" className="text-xs">{formatRupiah(buyer.totalDebt)}</Badge>
                  ) : (
                    <Badge className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Lunas</Badge>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(buyer)} className="flex-1 text-xs h-8">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteConfirm(buyer.id)}
                    className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
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
              {editId ? "Edit Pembeli" : "Tambah Pembeli Baru"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Pembeli *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Masukkan nama" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">No. Telepon</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxxxx" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Masukkan alamat" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} className="bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]">
              {editId ? "Simpan Perubahan" : "Tambah Pembeli"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Pembeli?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Data pembeli yang sudah dihapus tidak bisa dikembalikan.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
