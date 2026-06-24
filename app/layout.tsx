import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/contexts/AppContext'

export const metadata: Metadata = {
  title: 'Our Love Universe 💕',
  description: 'عالمنا الخاص - ذكرياتنا ورسائلنا ومناسباتنا',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
