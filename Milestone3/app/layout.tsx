import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '../components/Sidebar'
import { Topbar } from '../components/Topbar'

export const metadata: Metadata = {
  title: 'HR System - Milestone 3',
  description: 'Human Resources Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen bg-slate-50">
          <Sidebar />
          <div className="lg:ml-64">
            <Topbar />
            <main className="pt-20 p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
