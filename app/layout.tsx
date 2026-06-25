import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/contexts/AppContext'
import MusicPlayer from '@/components/MusicPlayer'

export const metadata: Metadata = {
  title: 'Our Love Universe 💕',
  description: 'عالمنا الخاص - ذكرياتنا ورسائلنا ومناسباتنا',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AppProvider>
          {children}
          <MusicPlayer />
        </AppProvider>
      </body>
    </html>
  )
}
