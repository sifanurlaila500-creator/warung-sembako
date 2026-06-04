"use client"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { getClientData, setClientData, generateId } from "@/lib/client-store"

interface Buyer {
  id: string
  name: string
  phone: string
  address: string
  createdAt: string
}

interface Transaction {
  id: string
  buyerId: string
  date: string
  totalAmount: number
  paidAmount: number
  type: string
  status: string
  notes: string
  items: { productId: string; productName: string; quantity: number; sellPrice: number; subtotal: number }[]
}

export function Buyers() {
  const { toast } = useToast()
  const [buyers, setBuyers] = useState<Buyer[]>(() => getClientData<Buyer>('buyers'))
  const [transactions] = useState<Transaction[]>(() => getClientData<Transaction>('transactions'))
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null)

  const [formName, setFormName] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formAddress, setFormAddress] = useState("")

  const refreshData = useCallback(() => {
    setBuyers(getClientData<Buyer>('buyers'))
  }, [])

  const buyersWithDebt = buyers.map((b) => {
    const buyerTx = transactions.filter((t) => t.buyerId === b.id && t.type === 'CREDIT')
    const totalDebt = buyerTx.reduce((sum, t) => sum + (t.totalAmount - t.paidAmount), 0)
    return { ...b, totalDebt }
  })

  const filteredBuyers = buyersWithDebt.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) || b.phone.includes(search)
  )

  const handleAdd = () => {
    if (!formName.trim()) {
      toast({ title: "Error", description: "Nama pembeli wajib diisi", variant: "destructive" })
      return
    }
    const newBuyer: Buyer = {
      id: generateId(),
      name: formName.trim(),
      phone: formPhone.trim(),
      address: formAddress.trim(),
      createdAt: new Date().toISOString(),
    }
    const updated = [...buyers, newBuyer]
    setClientData('buyers', updated)
    refreshData()
    setDialogOpen(false)
    setFormName(""); setFormPhone(""); setFormAddress("")
    toast({ title: "Berhasil", description: "Pembeli baru ditambahkan" })
  }

  const handleEdit = () => {
    if (!selectedBuyer || !formName.trim()) return
    const updated = buyers.map((b) =>
      b.id === selectedBuyer.id ? { ...b, name: formName.trim(), phone: formPhone.trim(), address: formAddress.trim() } : b
    )
    setClientData('buyers', updated)
    refreshData()
    setEditDialogOpen(false)
    toast({ title: "Berhasil", description: "Data pembeli diperbarui" })
  }

  const handleDelete = () => {
    if (!selectedBuyer) return
    const updated = buyers.filter((b) => b.id !== selectedBuyer.id)
    setClientData('buyers', updated)
    refreshData()
    setDeleteDialogOpen(false)
    toast({ title: "Berhasil", description: "Pembeli dihapus" })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <Input placeholder="Cari nama atau telepon..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => { setFormName(""); setFormPhone(""); setFormAddress(""); setDialogOpen(true) }} className="bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 11h-6"/><path d="M19 8v6"/></svg>
          Tambah Pembeli
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">{buyers.length} pembeli terdaftar</div>

      {filteredBuyers.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center text-muted-foreground">
            {search ? "Tidak ditemukan" : "Belum ada pembeli"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredBuyers.map((buyer) => (
            <Card key={buyer.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[oklch(0.35_0.12_250)]/10 text-[oklch(0.45_0.15_250)] flex items-center justify-center font-bold text-sm">
                      {buyer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{buyer.name}</p>
                      {buyer.phone && <p className="text-xs text-muted-foreground">{buyer.phone}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setSelectedBuyer(buyer); setFormName(buyer.name); setFormPhone(buyer.phone); setFormAddress(buyer.address); setEditDialogOpen(true) }} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </button>
                    <button onClick={() => { setSelectedBuyer(buyer); setDeleteDialogOpen(true) }} className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
                {buyer.totalDebt > 0 && (
                  <div className="mt-3 pt-3 border-t flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Hutang</span>
                    <span className="text-sm font-bold text-red-600">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(buyer.totalDebt)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-[oklch(0.35_0.12_250)]">Tambah Pembeli Baru</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Nama Pembeli *</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Masukkan nama" /></div>
            <div className="space-y-2"><Label>No. Telepon</Label><Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="08xxxxxxxxxx" /></div>
            <div className="space-y-2"><Label>Alamat</Label><Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Opsional" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleAdd} className="bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]">Tambah Pembeli</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-[oklch(0.35_0.12_250)]">Edit Pembeli</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Nama Pembeli *</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} /></div>
            <div className="space-y-2"><Label>No. Telepon</Label><Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} /></div>
            <div className="space-y-2"><Label>Alamat</Label><Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Batal</Button>
            <Button onClick={handleEdit} className="bg-[oklch(0.35_0.12_250)] hover:bg-[oklch(0.30_0.12_250)]">Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-red-600">Hapus Pembeli</DialogTitle></DialogHeader>
          <p className="py-4">Yakin ingin menghapus <strong>{selectedBuyer?.name}</strong>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
