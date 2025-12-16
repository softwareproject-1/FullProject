'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/auth/')

  if (isAuthPage) {
    return <main>{children}</main>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:ml-64">
        <Topbar />
        <main className="pt-20 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

