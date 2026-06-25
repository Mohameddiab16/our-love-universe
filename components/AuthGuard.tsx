'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/contexts/AppContext'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { activeWorldOwnerId } = useApp()
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [bgUrl, setBgUrl] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace('/auth')
        setLoading(false)
        return
      }

      const userId = session.user.id

      // Admin bypass — skip subscription check
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single()

      if (!profile?.is_admin) {
        // Check active paid subscription
        const { data: sub } = await supabase
          .from('user_subscriptions')
          .select('plan, expires_at')
          .eq('user_id', userId)
          .single()

        const hasPlan = sub && sub.plan && sub.plan !== 'free'
        const notExpired = !sub?.expires_at || new Date(sub.expires_at) > new Date()

        if (!hasPlan || !notExpired) {
          router.replace('/subscribe')
          setLoading(false)
          return
        }
      }

      setAuthed(true)
      setCurrentUserId(userId)
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
      .select('background_url')
      .eq('id', targetId)
      .single()
      .then(({ data }) => {
        setBgUrl(data?.background_url || null)
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
      {bgUrl && <div className="fixed inset-0 bg-white/70 dark:bg-black/60 pointer-events-none z-0" />}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
