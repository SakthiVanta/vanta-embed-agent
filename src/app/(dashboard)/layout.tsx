'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  Bot,
  Wrench,
  Key,
  BarChart3,
  Settings,
  Users,
  LogOut,
  Menu,
  ChevronDown,
  CreditCard,
  LayoutDashboard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserNav } from '@/components/user-nav'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

interface Workspace {
  id: string
  name: string
  slug: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('user')
    const workspaceData = localStorage.getItem('workspace')

    if (userData) {
      setUser(JSON.parse(userData))
    }
    if (workspaceData) {
      setWorkspace(JSON.parse(workspaceData))
    }
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    }

    // Clear local storage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('workspace')

    router.push('/login')
  }

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/agents', icon: Bot, label: 'Agents' },
    { href: '/tools', icon: Wrench, label: 'Tools' },
    { href: '/providers', icon: Key, label: 'Providers' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/team', icon: Users, label: 'Team' },
    { href: '/billing', icon: CreditCard, label: 'Billing' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-emerald-950 text-white flex flex-col transition-transform duration-200 ease-in-out`}>
          <div className="p-4 border-b border-emerald-900">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">Vanta AI</span>
            </Link>
            {workspace && (
              <div className="mt-2 text-xs text-emerald-300 flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                {workspace.name}
              </div>
            )}
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={<item.icon className="w-4 h-4" />}
                active={pathname === item.href || pathname.startsWith(item.href + '/')}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-3 border-t border-emerald-900">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-emerald-200 hover:bg-emerald-900 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 border-b bg-white dark:bg-slate-950 flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold">
                {navItems.find(item => pathname === item.href || pathname.startsWith(item.href + '/'))?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-sm text-muted-foreground">Pro Plan</span>
              <UserNav />
            </div>
          </header>

          <div className="flex-1 overflow-auto p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function NavLink({
  href,
  icon,
  children,
  active = false
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm ${active
        ? 'bg-emerald-900 text-white'
        : 'text-emerald-100 hover:bg-emerald-900'
        }`}
    >
      {icon}
      {children}
    </Link>
  )
}
