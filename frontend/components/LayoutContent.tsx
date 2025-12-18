'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { LogOut } from 'lucide-react'

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, logout, isAuthenticated } = useAuth()

  // Hide sidebar/topbar on auth pages
  const isAuthPage = pathname?.startsWith('/auth/')

  // Check if user is a candidate
  const isCandidate = user?.roles?.some(r => r.toLowerCase() === 'job candidate')
  const isCandidatePage = pathname?.startsWith('/candidate')

  // Redirect to login if not authenticated and not on auth page
  useEffect(() => {
    if (!loading && !isAuthenticated && !isAuthPage) {
      router.replace('/auth/login')
    }
  }, [loading, isAuthenticated, isAuthPage, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-500 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render content if not authenticated and not on auth page
  if (!isAuthenticated && !isAuthPage) {
    return null
  }

  if (isAuthPage) {
    return <main>{children}</main>
  }

  // Show a simpler layout for candidate pages
  if (isCandidate && isCandidatePage) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 fixed top-0 left-0 right-0 z-10 shadow-sm">
          <div className="h-full px-6 flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="text-xl font-bold text-slate-900">HR System</div>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600">Candidate Portal</span>
            </div>
            {isAuthenticated && user && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="pt-20 p-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    )
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
