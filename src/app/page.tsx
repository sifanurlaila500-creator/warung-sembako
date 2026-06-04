"use client"

import { useState } from "react"
import { Sidebar, MobileNav, MobileMoreMenu, TabType } from "@/components/warung/Sidebar"
import { Dashboard } from "@/components/warung/Dashboard"
import { Buyers } from "@/components/warung/Buyers"
import { Products } from "@/components/warung/Products"
import { Transactions } from "@/components/warung/Transactions"
import { Debts } from "@/components/warung/Debts"
import { Reports } from "@/components/warung/Reports"

const tabs = [
  {
    id: "dashboard" as TabType,
    label: "Dashboard",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>,
  },
  {
    id: "buyers" as TabType,
    label: "Pembeli",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    id: "products" as TabType,
    label: "Barang",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
  },
  {
    id: "transactions" as TabType,
    label: "Transaksi",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>,
  },
  {
    id: "debts" as TabType,
    label: "Hutang",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  },
  {
    id: "reports" as TabType,
    label: "Laporan",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
  },
]

const tabTitles: Record<TabType, string> = {
  dashboard: "Dashboard",
  buyers: "Data Pembeli",
  products: "Data Barang",
  transactions: "Transaksi",
  debts: "Manajemen Hutang",
  reports: "Laporan Keuangan",
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard")

  return (
    <div className="h-screen flex overflow-hidden bg-[oklch(0.97_0.005_250)]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="shrink-0 z-40 bg-white/80 backdrop-blur-md border-b px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[oklch(0.35_0.12_250)]">{tabTitles[activeTab]}</h2>
              <p className="text-sm text-muted-foreground hidden sm:block">Warung Sembako - Sistem Pencatatan Tagihan</p>
            </div>
            <div className="md:hidden flex items-center gap-2">
              <span className="text-lg font-bold text-[oklch(0.35_0.12_250)]">🏪</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "buyers" && <Buyers />}
          {activeTab === "products" && <Products />}
          {activeTab === "transactions" && <Transactions />}
          {activeTab === "debts" && <Debts />}
          {activeTab === "reports" && <Reports />}
        </main>

      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />
    </div>
  )
}
