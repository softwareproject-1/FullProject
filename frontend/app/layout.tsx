import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '../context/AuthContext'
import { LayoutContent } from '../components/LayoutContent'

export const metadata: Metadata = {
  title: 'HR System - Recruitment',
  description: 'Human Resources Management System - Recruitment, Onboarding & Offboarding',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AuthProvider>
          <LayoutContent>
            {children}
          </LayoutContent>
        </AuthProvider>
      </body>
    </html>
  )
}
