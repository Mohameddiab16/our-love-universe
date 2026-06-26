'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/contexts/AppContext'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { activeWorldOwnerId, darkMode } = useApp()
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [bgUrl, setBgUrl] = useState<string | null>(null)
  const [bgClarity, setBgClarity] = useState(30) // 0 = faded, 100 = fully visible
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace('/auth')
        setLoading(false)
        return
      }
      setAuthed(true)
      setCurrentUserId(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/auth')
    })

    return () => subscription.unsubscribe()
  }, [router])

  // Load background - either from active world owner or current user
  useEffect(() => {
    if (!currentUserId) return
    const targetId = activeWorldOwnerId || currentUserId
    supabase
      .from('profiles')
      .select('background_url, background_opacity')
      .eq('id', targetId)
      .single()
      .then(({ data }) => {
        setBgUrl(data?.background_url || null)
        if (typeof data?.background_opacity === 'number') setBgClarity(data.background_opacity)
      })
  }, [currentUserId, activeWorldOwnerId])

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
      {bgUrl && (
        <div className="fixed inset-0 pointer-events-none z-0"
          style={{ backgroundColor: darkMode
            ? `rgba(0,0,0,${(100 - bgClarity) / 100})`
            : `rgba(255,255,255,${(100 - bgClarity) / 100})` }} />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
