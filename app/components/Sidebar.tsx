'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  LayoutDashboard,
  Image,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Lightbulb,
  Sparkles,
  Images,
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  badge?: number
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/pax/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    name: 'Creatives',
    href: '/creatives',
    icon: <Image className="w-5 h-5" />,
    badge: 14,
  },
  {
    name: 'Galería',
    href: '/gallery',
    icon: <Images className="w-5 h-5" />,
  },
  {
    name: 'Campaign Insights',
    href: '/campaign-insights',
    icon: <Lightbulb className="w-5 h-5" />,
  },
  {
    name: 'Analytics',
    href: '/scrapers',
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: <Settings className="w-5 h-5" />,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      if (response.ok) {
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  // El sidebar se expande con hover
  const isExpanded = isHovered

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="h-10 w-10 p-0 bg-slate-900/90 backdrop-blur-sm border border-violet-500/20"
        >
          {isMobileOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'relative transition-all duration-300 ease-out max-h-screen overflow-hidden',
          isExpanded ? 'w-64' : 'w-[72px]',
          // Mobile: fixed, Desktop: sticky
          'fixed left-0 top-0 z-40 h-screen lg:relative lg:sticky lg:top-0 lg:h-auto lg:z-auto',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-violet-950/90" />

        {/* Subtle shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5" />

        {/* Border right with gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/20 via-purple-500/30 to-violet-500/20" />

        <div className="relative flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center gap-3 p-4 border-b border-violet-500/10">
            <div className="relative group">
              {/* Logo background with gradient */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className={cn(
              'flex flex-col overflow-hidden transition-all duration-300',
              isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
            )}>
              <span className="font-bold text-white text-sm whitespace-nowrap">Meduzia</span>
              <span className="text-[10px] text-violet-300/70 whitespace-nowrap">Creative Studio</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                    active
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  {/* Active background with gradient */}
                  {active && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/20 via-purple-500/15 to-violet-500/10 border border-violet-500/30" />
                  )}

                  {/* Hover background */}
                  {!active && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/0 via-purple-500/0 to-violet-500/0 group-hover:from-violet-500/10 group-hover:via-purple-500/8 group-hover:to-violet-500/5 transition-all duration-300" />
                  )}

                  {/* Icon container */}
                  <div className={cn(
                    'relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200',
                    active
                      ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/30'
                      : 'text-slate-400 group-hover:text-violet-300'
                  )}>
                    {item.icon}
                  </div>

                  {/* Label */}
                  <span className={cn(
                    'relative flex-1 text-sm font-medium whitespace-nowrap transition-all duration-300',
                    isExpanded ? 'opacity-100' : 'opacity-0 w-0'
                  )}>
                    {item.name}
                  </span>

                  {/* Badge */}
                  {item.badge && isExpanded && (
                    <span className="relative bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center shadow-sm shadow-rose-500/30">
                      {item.badge}
                    </span>
                  )}

                  {/* Badge for collapsed */}
                  {item.badge && !isExpanded && (
                    <span className="absolute -right-1 -top-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center shadow-sm shadow-rose-500/30">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}

                  {/* Tooltip for collapsed state */}
                  {!isExpanded && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900/95 backdrop-blur-sm text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-violet-500/20 shadow-lg shadow-black/20">
                      {item.name}
                      {/* Tooltip arrow */}
                      <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900/95 border-l border-b border-violet-500/20 rotate-45" />
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer Section */}
          <div className="border-t border-violet-500/10 p-3 space-y-2">
            {/* Theme Toggle */}
            <div className={cn(
              'flex items-center',
              isExpanded ? 'justify-start px-2' : 'justify-center'
            )}>
              <ThemeToggle />
            </div>

            {/* Logout Button */}
            <Button
              variant="ghost"
              className={cn(
                'w-full group relative rounded-xl transition-all duration-200 overflow-hidden',
                isExpanded ? 'justify-start px-3' : 'justify-center px-0'
              )}
              onClick={handleLogout}
            >
              {/* Hover gradient */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-rose-500/0 via-red-500/0 to-rose-500/0 group-hover:from-rose-500/10 group-hover:via-red-500/8 group-hover:to-rose-500/5 transition-all duration-300" />

              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg text-rose-400 group-hover:text-rose-300 transition-colors">
                <LogOut className="w-5 h-5" />
              </div>

              {isExpanded && (
                <span className="relative ml-2 text-sm text-rose-400 group-hover:text-rose-300 transition-colors whitespace-nowrap">
                  Cerrar sesión
                </span>
              )}
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
