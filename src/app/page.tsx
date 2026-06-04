"use client"

import { useState, useEffect, useRef } from "react"
import { Sidebar, MobileNav, TabType } from "@/components/warung/Sidebar"
import { Dashboard } from "@/components/warung/Dashboard"
import { Buyers } from "@/components/warung/Buyers"
import { Products } from "@/components/warung/Products"
import { Transactions } from "@/components/warung/Transactions"
import { Debts } from "@/components/warung/Debts"
import { Reports } from "@/components/warung/Reports"
import { Login } from "@/components/warung/Login"
import { StorageWarning } from "@/components/warung/StorageWarning"

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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null) // null = checking
  const hasChecked = useRef(false)

  useEffect(() => {
    if (hasChecked.current) return
    hasChecked.current = true

    let cancelled = false
    fetch("/api/auth/verify")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setIsAuthenticated(data.authenticated === true)
        }
      })
      .catch(() => {
        if (!cancelled) setIsAuthenticated(false)
      })

    return () => { cancelled = true }
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // ignore
    }
    setIsAuthenticated(false)
  }

  // Loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.20_0.08_250)] via-[oklch(0.25_0.10_250)] to-[oklch(0.15_0.06_250)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center animate-pulse">
            <span className="text-3xl">🏪</span>
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span className="text-sm">Memverifikasi...</span>
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated - show login
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  // Authenticated - show main app
  return (
    <div className="h-screen flex overflow-hidden bg-[oklch(0.97_0.005_250)]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} onLogout={handleLogout} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="shrink-0 z-40 bg-white/80 backdrop-blur-md border-b px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[oklch(0.35_0.12_250)]">{tabTitles[activeTab]}</h2>
              <p className="text-sm text-muted-foreground hidden sm:block">WARUNG SIFA - Sistem Pencatatan Tagihan</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Logout button on mobile */}
              <button
                onClick={handleLogout}
                className="md:hidden flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-md hover:bg-red-50"
                title="Keluar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span>Keluar</span>
              </button>
              <div className="md:hidden flex items-center gap-2">
                <span className="text-lg font-bold text-[oklch(0.35_0.12_250)]">🏪</span>
              </div>
            </div>
          </div>
        </header>

        {/* Storage Warning */}
        <StorageWarning />

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
