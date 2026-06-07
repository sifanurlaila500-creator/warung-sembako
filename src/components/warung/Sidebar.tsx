"use client"

import { ReactNode, useState } from "react"
import { cn } from "@/lib/utils"

export type TabType = "dashboard" | "buyers" | "products" | "transactions" | "debts" | "reports"

interface TabConfig {
  id: TabType
  label: string
  icon: ReactNode
}

interface SidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  tabs: TabConfig[]
  onLogout?: () => void
}

export function Sidebar({ activeTab, onTabChange, tabs, onLogout }: SidebarProps) {
  return (
    <aside className="w-64 h-screen bg-[oklch(0.20_0.08_250)] text-white flex flex-col shrink-0 sticky top-0">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight">🏪 WARUNG SIFA</h1>
        <p className="text-xs text-white/60 mt-1">Sistem Pencatatan Tagihan</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === tab.id
                ? "bg-[oklch(0.35_0.12_250)] text-white shadow-lg shadow-black/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        {/* Logout button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-red-400 hover:bg-white/5 transition-all duration-200 mb-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Keluar
          </button>
        )}
        <p className="text-xs text-white/40 text-center">© 2025 WARUNG SIFA</p>
      </div>
    </aside>
  )
}

export function MobileNav({ activeTab, onTabChange, tabs }: SidebarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[oklch(0.20_0.08_250)] border-t border-white/10 md:hidden safe-area-bottom">
      <nav className="grid grid-cols-6 items-center py-1.5 px-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[10px] font-medium transition-all",
              activeTab === tab.id
                ? "text-white bg-white/10"
                : "text-white/50"
            )}
          >
            {tab.icon}
            <span className="truncate max-w-[52px]">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export function MobileMoreMenu({ activeTab, onTabChange, tabs }: SidebarProps) {
  const [open, setOpen] = useState(false)
  const remainingTabs = tabs.slice(4)

  if (remainingTabs.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-white/50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        <span>Lainnya</span>
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 bg-[oklch(0.25_0.10_250)] rounded-lg shadow-xl border border-white/10 py-2 min-w-[160px]">
          {remainingTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { onTabChange(tab.id); setOpen(false) }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all",
                activeTab === tab.id ? "bg-[oklch(0.35_0.12_250)] text-white" : "text-white/70 hover:bg-white/10"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
