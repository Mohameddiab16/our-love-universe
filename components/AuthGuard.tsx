'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import MusicPlayer from './MusicPlayer'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [bgUrl, setBgUrl] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace('/auth')
        setLoading(false)
        return
      }
      setAuthed(true)
      // Load background
      const { data } = await supabase
        .from('profiles')
        .select('background_url')
        .eq('id', session.user.id)
        .single()
      if (data?.background_url) setBgUrl(data.background_url)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/auth')
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">💕</div>
          <p className="gradient-text font-bold text-lg">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!authed) return null

  return (
    <div className="min-h-screen" style={bgUrl ? {
      backgroundImage: `url(${bgUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    } : {}}>
      {bgUrl && <div className="fixed inset-0 bg-white/70 dark:bg-black/60 pointer-events-none z-0" />}
      <div className="relative z-10">{children}</div>
      <MusicPlayer />
    </div>
  )
}
