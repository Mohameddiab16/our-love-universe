'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { FiHeart, FiGlobe, FiCheckCircle, FiX } from 'react-icons/fi'

export default function InvitePage() {
  const { token } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [invite, setInvite] = useState<any>(null)
  const [world, setWorld] = useState<any>(null)
  const [ownerProfile, setOwnerProfile] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => { loadInvite() }, [token])

  const loadInvite = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)

    const { data: inv, error: invErr } = await supabase
      .from('partner_invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (invErr || !inv) {
      setError('رابط الدعوة غير صالح أو منتهي الصلاحية')
      setLoading(false)
      return
    }

    if (inv.status === 'accepted') {
      setError('تم قبول هذه الدعوة مسبقاً')
      setLoading(false)
      return
    }

    const { data: w } = await supabase.from('worlds').select('*').eq('id', inv.world_id).single()
    const { data: owner } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', inv.sender_id).single()

    setInvite(inv)
    setWorld(w)
    setOwnerProfile(owner)
    setLoading(false)
  }

  const handleAccept = async () => {
    if (!currentUser) {
      router.push(`/auth?redirect=/invite/${token}`)
      return
    }

    setJoining(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setError('يرجى تسجيل الدخول أولاً'); setJoining(false); return }

    const res = await fetch('/api/accept-invite', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ inviteToken: token }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error || 'حدث خطأ في الانضمام')
      setJoining(false)
      return
    }

    setSuccess(true)
    setJoining(false)
    setTimeout(() => router.push('/'), 2500)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">💕</div>
          <p className="gradient-text font-bold">جاري تحميل الدعوة...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">دعوة غير صالحة</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={() => router.push('/')} className="btn-primary w-full">الذهاب للرئيسية</button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <FiCheckCircle className="text-green-500 text-4xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">انضممت للعالم بنجاح! 🎉</h2>
          <p className="text-gray-500 mb-1">دلوقتي تقدر تشوف كل محتوى</p>
          <p className="font-bold gradient-text">{ownerProfile?.full_name || 'صاحب العالم'}</p>
          <p className="text-sm text-gray-400 mt-3">جاري تحويلك...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-10 right-10 text-6xl opacity-10 animate-pulse">💕</div>
      <div className="absolute bottom-10 left-10 text-5xl opacity-10 animate-pulse">🌙</div>

      <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center">
        {/* Header */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
          <FiHeart className="text-white text-4xl" />
        </div>
        <h1 className="text-2xl font-bold gradient-text mb-1">Our Love Universe</h1>
        <p className="text-gray-400 text-sm mb-6">لديك دعوة للانضمام 💌</p>

        {/* Owner Info */}
        {ownerProfile && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-pink-50 justify-center">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-pink-200 flex items-center justify-center flex-shrink-0">
              {ownerProfile.avatar_url
                ? <img src={ownerProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span>👤</span>}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">دعوة من</p>
              <p className="font-bold text-gray-800">{ownerProfile.full_name}</p>
            </div>
          </div>
        )}

        {/* World Info */}
        {world && (
          <div className="rounded-2xl p-5 mb-6 text-right"
            style={{ background: 'linear-gradient(135deg, var(--light), #ede9fe)' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{world.cover_emoji}</span>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{world.name}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <FiGlobe size={11} />
                  {world.type === 'couple' ? 'عالم ثنائي 💑' : world.type === 'family' ? 'عالم عائلي 👨‍👩‍👧‍👦' : 'عالم شخصي 🌍'}
                </p>
              </div>
            </div>
            {world.description && <p className="text-sm text-gray-600 mt-2">{world.description}</p>}
            <div className="mt-3 pt-3 border-t border-white/50">
              <span className="text-xs text-pink-600 font-medium">
                دورك: {invite.role === 'admin' ? '🔑 مسؤول' : invite.role === 'editor' ? '✏️ محرر' : '👁️ مشاهد'}
              </span>
            </div>
          </div>
        )}

        {/* What you'll see */}
        <div className="text-right mb-6 p-4 rounded-2xl bg-blue-50">
          <p className="text-xs font-semibold text-blue-700 mb-2">✨ بعد القبول هتشوف:</p>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>📸 الصور والذكريات</li>
            <li>🎵 الأغاني المختارة</li>
            <li>💌 الرسائل المشتركة</li>
            <li>📅 المناسبات والأحداث</li>
          </ul>
        </div>

        {!currentUser ? (
          <div className="space-y-3">
            <p className="text-gray-500 text-sm mb-4">يجب تسجيل الدخول أولاً للانضمام</p>
            <button onClick={() => router.push(`/auth?redirect=/invite/${token}`)} className="btn-primary w-full">
              <FiHeart className="inline ml-2" /> تسجيل الدخول للانضمام
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button onClick={handleAccept} disabled={joining}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {joining ? '⏳ جاري الانضمام...' : <><FiCheckCircle size={16} /> قبول الدعوة</>}
            </button>
            <button onClick={() => router.push('/')}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-500 flex items-center justify-center gap-2">
              <FiX size={16} /> رفض
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
