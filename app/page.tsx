'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import PinnedCounter from '@/components/PinnedCounter'
import Modal from '@/components/Modal'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/contexts/AppContext'
import { useSiteTexts } from '@/lib/useSiteTexts'
import { FiImage, FiMessageCircle, FiCalendar, FiHeart, FiMapPin, FiZap, FiGift, FiStar, FiGlobe, FiPlus, FiCheck } from 'react-icons/fi'

interface PinnedConfig {
  title: string
  date: string
  direction: 'up' | 'down'
  emoji: string
}

interface Occasion { id: string; title: string; date: string; type: string }

export default function Dashboard() {
  const { activeWorldId } = useApp()
  const t = useSiteTexts()
  const [stats, setStats] = useState({ memories: 0, messages: 0, occasions: 0 })
  const [userName, setUserName] = useState('')
  const [userId, setUserId] = useState('')
  const [recentMemories, setRecentMemories] = useState<any[]>([])
  const [upcomingOccasions, setUpcomingOccasions] = useState<Occasion[]>([])
  const [loading, setLoading] = useState(true)
  const [pinnedConfig, setPinnedConfig] = useState<PinnedConfig | null>(null)
  const [points, setPoints] = useState(0)

  // Counter editor modal
  const [counterModal, setCounterModal] = useState(false)
  const [allOccasions, setAllOccasions] = useState<Occasion[]>([])
  const [counterForm, setCounterForm] = useState<PinnedConfig>({
    title: '', date: new Date().toISOString().split('T')[0], direction: 'up', emoji: '💕'
  })
  const [counterSource, setCounterSource] = useState<'custom' | 'occasion'>('custom')
  const [savingCounter, setSavingCounter] = useState(false)

  useEffect(() => { loadData() }, [activeWorldId])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'حبيبي')

    // Scope every content query to the active world (or personal when none) so the
    // dashboard counts match what the individual pages actually display.
    const scope = (q: any) => activeWorldId
      ? q.eq('world_id', activeWorldId)
      : q.eq('user_id', user.id).is('world_id', null)

    const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time

    const [
      { count: mC, data: allMem },
      { count: msC },
      { count: oC },
      { data: occ },
      { data: profile },
      { count: pc },
    ] = await Promise.all([
      scope(supabase.from('memories').select('*', { count: 'exact' })).order('created_at', { ascending: false }).limit(3),
      scope(supabase.from('messages').select('*', { count: 'exact', head: true })),
      scope(supabase.from('occasions').select('*', { count: 'exact', head: true })),
      scope(supabase.from('occasions').select('*')).gte('date', today).order('date').limit(3),
      supabase.from('profiles').select('pinned_counter').eq('id', user.id).single(),
      supabase.from('user_challenges').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    setStats({ memories: mC || 0, messages: msC || 0, occasions: oC || 0 })
    setRecentMemories(allMem || [])
    setUpcomingOccasions(occ || [])
    if (profile?.pinned_counter) setPinnedConfig(profile.pinned_counter as PinnedConfig)
    setPoints((pc || 0) * 10)
    setLoading(false)
  }

  const openCounterEditor = async () => {
    const { data: occ } = await supabase.from('occasions').select('*').eq('user_id', userId).order('date')
    setAllOccasions(occ || [])
    if (pinnedConfig) setCounterForm(pinnedConfig)
    setCounterModal(true)
  }

  const handleSelectOccasion = (occ: Occasion) => {
    const isPast = new Date(occ.date) < new Date()
    setCounterForm({
      title: occ.title,
      date: occ.date,
      direction: isPast ? 'up' : 'down',
      emoji: occ.type === 'anniversary' ? '💑' : occ.type === 'birthday' ? '🎂' : occ.type === 'trip' ? '✈️' : '🎉',
    })
    setCounterSource('occasion')
  }

  const handleSaveCounter = async () => {
    setSavingCounter(true)
    await supabase.from('profiles').update({ pinned_counter: counterForm }).eq('id', userId)
    setPinnedConfig(counterForm)
    setSavingCounter(false)
    setCounterModal(false)
  }

  const getDaysUntil = (date: string) => {
    const now = new Date()
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const [y, m, d] = date.split('-').map(Number)
    const target = new Date(y, m - 1, d)
    return Math.round((target.getTime() - todayLocal.getTime()) / (1000 * 60 * 60 * 24))
  }

  const emojis = ['💕', '💑', '🎉', '🌙', '⭐', '🌸', '💍', '🏠', '✈️', '🎂', '❤️', '🌹']

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Navbar />
        <main className="flex-1 md:mr-64 p-4 md:p-8 pt-16 md:pt-8 animate-fadeIn">

          {/* Welcome */}
          <div className="glass-card rounded-3xl p-6 mb-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 text-9xl opacity-5 select-none leading-none">💕</div>
            <div className="relative">
              <p className="text-sm mb-1" style={{ color: 'var(--primary)' }}>{t('home_welcome', 'أهلاً بك ✨')}</p>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-1">
                مرحباً، <span className="gradient-text">{userName}</span>
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge badge-pink"><FiZap size={11} /> {points} نقطة</span>
                {activeWorldId && <span className="badge badge-purple"><FiGlobe size={11} /> عالم محدد</span>}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'ذكريات', value: stats.memories, icon: FiImage, href: '/memories' },
              { label: 'رسائل', value: stats.messages, icon: FiMessageCircle, href: '/messages' },
              { label: 'مناسبات', value: stats.occasions, icon: FiCalendar, href: '/occasions' },
            ].map(({ label, value, icon: Icon, href }) => (
              <Link key={href} href={href}>
                <div className="stat-card text-center cursor-pointer">
                  <Icon className="mx-auto mb-2 text-xl" style={{ color: 'var(--primary)' }} />
                  <p className="text-2xl font-bold gradient-text">{loading ? '—' : value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-4">

              {/* Pinned Counter */}
              {pinnedConfig ? (
                <PinnedCounter config={pinnedConfig} onEdit={openCounterEditor} />
              ) : (
                <button onClick={openCounterEditor}
                  className="w-full glass-card rounded-2xl p-5 flex items-center justify-center gap-3 border-2 border-dashed hover:border-pink-300 transition-colors"
                  style={{ borderColor: 'rgba(255,107,157,0.3)' }}>
                  <FiPlus style={{ color: 'var(--primary)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
                    أضف عداداً مميزاً (معاً منذ / فاضل على...)
                  </span>
                </button>
              )}

              {/* Upcoming Occasions */}
              {upcomingOccasions.length > 0 && (
                <div>
                  <h2 className="font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <FiStar style={{ color: 'var(--primary)' }} /> مناسبات قادمة
                  </h2>
                  <div className="space-y-2">
                    {upcomingOccasions.map(occ => {
                      const days = getDaysUntil(occ.date)
                      return (
                        <div key={occ.id} className="memory-card flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🎉</span>
                            <div>
                              <p className="font-semibold text-sm">{occ.title}</p>
                              <p className="text-xs text-gray-400">
                                {(() => { const [y,m,d] = occ.date.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('ar-EG', { month: 'long', day: 'numeric' }) })()}
                              </p>
                            </div>
                          </div>
                          <span className={`badge ${days === 0 ? 'badge-pink' : days <= 7 ? 'badge-orange' : 'badge-green'}`}>
                            {days === 0 ? '🎉 اليوم' : `${days} يوم`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Recent Memories */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <FiImage style={{ color: 'var(--primary)' }} /> آخر الذكريات
                  </h2>
                  <Link href="/memories" className="text-sm hover:underline" style={{ color: 'var(--primary)' }}>عرض الكل</Link>
                </div>
                {loading ? (
                  <div className="space-y-2">
                    {[1,2].map(i => <div key={i} className="memory-card h-16 animate-pulse bg-gray-100" />)}
                  </div>
                ) : recentMemories.length === 0 ? (
                  <div className="memory-card text-center py-8">
                    <p className="text-4xl mb-2">📸</p>
                    <p className="text-gray-500 text-sm mb-3">لا توجد ذكريات بعد</p>
                    <Link href="/memories" className="btn-primary text-sm inline-flex items-center gap-1">
                      <FiHeart size={14} /> أضف أول ذكرى
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentMemories.map(m => (
                      <div key={m.id} className="memory-card flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, var(--light), #ede9fe)' }}>
                          <FiImage style={{ color: 'var(--primary)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{m.title}</p>
                          <div className="flex items-center gap-2">
                            {m.location && <span className="text-xs text-gray-400 flex items-center gap-0.5"><FiMapPin size={9} /> {m.location}</span>}
                            <span className="text-xs text-gray-400">{new Date(m.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h2 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <FiZap style={{ color: 'var(--primary)' }} /> وصول سريع
              </h2>
              {[
                { href: '/challenges',    label: 'التحديات اليومية', icon: FiZap,  desc: 'اكسب نقاط يومياً' },
                { href: '/date-ideas',    label: 'أفكار تواريخ',    icon: FiGift, desc: 'استكشفا أفكاراً جديدة' },
                { href: '/compatibility', label: 'اختبار التوافق',  icon: FiHeart,desc: 'كم نسبة توافقكما؟' },
                { href: '/worlds',        label: 'العوالم',          icon: FiGlobe,desc: 'إدارة عوالمك' },
              ].map(({ href, label, icon: Icon, desc }) => (
                <Link key={href} href={href}>
                  <div className="memory-card flex items-center gap-3 cursor-pointer mb-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, var(--light), #ede9fe)' }}>
                      <Icon style={{ color: 'var(--primary)' }} size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
              <div className="p-4 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, var(--light), #ede9fe)' }}>
                <p className="text-sm text-gray-600 italic">{t('home_subtitle', '"في عالمنا الصغير، تجد قلبي وطناً دائماً" 💕')}</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Counter Editor Modal */}
      <Modal isOpen={counterModal} onClose={() => setCounterModal(false)} title="تخصيص العداد 💕">
        <div className="space-y-4">
          {/* Source selector */}
          <div className="flex gap-2">
            {[{ v: 'custom', l: '✏️ مخصص' }, { v: 'occasion', l: '🎉 من المناسبات' }].map(s => (
              <button key={s.v} onClick={() => setCounterSource(s.v as any)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all ${counterSource === s.v ? 'text-white border-transparent' : 'border-gray-100 text-gray-500'}`}
                style={counterSource === s.v ? { background: 'linear-gradient(135deg, var(--primary), var(--secondary))' } : {}}>
                {s.l}
              </button>
            ))}
          </div>

          {/* Occasions list */}
          {counterSource === 'occasion' && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {allOccasions.length === 0
                ? <p className="text-center text-gray-400 text-sm py-4">لا توجد مناسبات، أضف من صفحة المناسبات</p>
                : allOccasions.map(occ => (
                  <button key={occ.id} onClick={() => handleSelectOccasion(occ)}
                    className={`w-full p-3 rounded-xl border-2 text-right flex items-center justify-between transition-all ${counterForm.title === occ.title ? 'border-pink-400 bg-pink-50' : 'border-gray-100 hover:border-pink-200'}`}>
                    <div>
                      <p className="font-semibold text-sm">{occ.title}</p>
                      <p className="text-xs text-gray-400">{new Date(occ.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    {counterForm.title === occ.title && <FiCheck style={{ color: 'var(--primary)' }} />}
                  </button>
                ))
              }
            </div>
          )}

          {/* Custom fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان العداد</label>
            <input type="text" value={counterForm.title}
              onChange={e => setCounterForm({ ...counterForm, title: e.target.value })}
              className="input-field" placeholder="مثال: معاً منذ / فاضل على زفافنا" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
            <input type="date" value={counterForm.date}
              onChange={e => setCounterForm({ ...counterForm, date: e.target.value })}
              className="input-field" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الاتجاه</label>
            <div className="flex gap-2">
              {[{ v: 'up', l: '⏱️ عدّ تصاعدي (منذ...)' }, { v: 'down', l: '⏳ عدّ تنازلي (فاضل...)' }].map(d => (
                <button key={d.v} onClick={() => setCounterForm({ ...counterForm, direction: d.v as any })}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium border-2 transition-all ${counterForm.direction === d.v ? 'text-white border-transparent' : 'border-gray-100 text-gray-500'}`}
                  style={counterForm.direction === d.v ? { background: 'linear-gradient(135deg, var(--primary), var(--secondary))' } : {}}>
                  {d.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الإيموجي</label>
            <div className="flex flex-wrap gap-2">
              {emojis.map(e => (
                <button key={e} onClick={() => setCounterForm({ ...counterForm, emoji: e })}
                  className={`w-10 h-10 rounded-xl text-xl border-2 transition-all ${counterForm.emoji === e ? 'border-pink-400 bg-pink-50' : 'border-gray-100 hover:border-pink-200'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={handleSaveCounter} disabled={savingCounter || !counterForm.title}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {savingCounter ? 'جاري الحفظ...' : <><FiHeart size={14} /> حفظ العداد</>}
            </button>
            <button onClick={() => setCounterModal(false)}
              className="flex-1 py-3 rounded-xl border-2 border-gray-100 text-gray-500">إلغاء</button>
          </div>
        </div>
      </Modal>
    </AuthGuard>
  )
}
