import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppProvider } from '@/contexts/AppContext'
import MusicPlayer from '@/components/MusicPlayer'

export const metadata: Metadata = {
  title: 'Our Love Universe 💕',
  description: 'عالمنا الخاص - ذكرياتنا ورسائلنا ومناسباتنا',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Our Love Universe',
  },
}

export const viewport: Viewport = {
  themeColor: '#e91e8c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body>
        <AppProvider>
          {children}
          <MusicPlayer />
        </AppProvider>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
              })
            }
          `
        }} />
      </body>
    </html>
  )
}
