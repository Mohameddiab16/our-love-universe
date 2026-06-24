'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import Modal from '@/components/Modal'
import { supabase } from '@/lib/supabase'
import { FiShield, FiUsers, FiTag, FiBarChart2, FiPlus, FiTrash2, FiToggleLeft, FiToggleRight } from 'react-icons/fi'

interface PromoCode {
  id: string
  code: string
  plan: string
  free_days: number
  max_uses: number | null
  current_uses: number
  is_active: boolean
  expires_at: string | null
  created_at: string
}

interface UserStat {
  plan: string
  count: number
}

export default function AdminPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [tab, setTab] = useState<'stats' | 'users' | 'promo'>('stats')
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [userStats, setUserStats] = useState<UserStat[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalMemories, setTotalMemories] = useState(0)
  const [totalMessages, setTotalMessages] = useState(0)
  const [promoModal, setPromoModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [promoForm, setPromoForm] = useState({
    code: '', plan: 'couple', free_days: 30, max_uses: '', expires_at: ''
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return router.push('/')
      supabase.from('profiles').select('is_admin').eq('id', user.id).single().then(({ data }) => {
        if (!data?.is_admin) { router.push('/'); return }
        setIsAdmin(true)
        loadData()
      })
    })
  }, [])

  const loadData = async () => {
    const [
      { data: promos },
      { count: uCount },
      { count: mCount },
      { count: msgCount },
      { data: subStats },
    ] = await Promise.all([
      supabase.from('promo_codes').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('memories').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('user_subscriptions').select('plan'),
    ])

    setPromoCodes(promos || [])
    setTotalUsers(uCount || 0)
    setTotalMemories(mCount || 0)
    setTotalMessages(msgCount || 0)

    const counts: Record<string, number> = {}
    ;(subStats || []).forEach((s: any) => { counts[s.plan] = (counts[s.plan] || 0) + 1 })
    setUserStats(Object.entries(counts).map(([plan, count]) => ({ plan, count })))
  }

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('promo_codes').insert({
      code: promoForm.code.toUpperCase(),
      plan: promoForm.plan,
      free_days: Number(promoForm.free_days),
      max_uses: promoForm.max_uses ? Number(promoForm.max_uses) : null,
      expires_at: promoForm.expires_at || null,
      is_active: true,
    })
    setPromoModal(false)
    setSaving(false)
    loadData()
  }

  const togglePromo = async (id: string, current: boolean) => {
    await supabase.from('promo_codes').update({ is_active: !current }).eq('id', id)
    loadData()
  }

  const deletePromo = async (id: string) => {
    if (!confirm('حذف هذا الكود؟')) return
    await supabase.from('promo_codes').delete().eq('id', id)
    loadData()
  }

  if (isAdmin === null) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-5xl animate-pulse">⚙️</p>
    </div>
  )

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Navbar />
        <main className="flex-1 md:mr-64 p-4 md:p-8 pt-16 md:pt-8 animate-fadeIn">
          <div className="mb-6">
            <h1 className="text-2xl font-bold gradient-text flex items-center gap-2 mb-1">
              <FiShield /> لوحة تحكم الإدارة
            </h1>
            <p className="text-gray-400 text-sm">إدارة المنصة والمستخدمين والأكواد ⚙️</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { id: 'stats', label: 'الإحصائيات', icon: FiBarChart2 },
              { id: 'promo', label: 'الأكواد الترويجية', icon: FiTag },
              { id: 'users', label: 'المستخدمون', icon: FiUsers },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? 'text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
                style={tab === t.id ? { background: 'linear-gradient(135deg, var(--primary), var(--secondary))' } : {}}>
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>

          {/* Stats Tab */}
          {tab === 'stats' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'المستخدمون', value: totalUsers, emoji: '👥' },
                  { label: 'الذكريات', value: totalMemories, emoji: '📸' },
                  { label: 'الرسائل', value: totalMessages, emoji: '💌' },
                  { label: 'الأكواد', value: promoCodes.length, emoji: '🏷️' },
                ].map(s => (
                  <div key={s.label} className="stat-card text-center">
                    <p className="text-3xl mb-1">{s.emoji}</p>
                    <p className="text-2xl font-bold gradient-text">{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Plan Distribution */}
              <div className="glass-card rounded-2xl p-5">
                <h2 className="font-bold text-gray-800 dark:text-white mb-4">توزيع خطط الاشتراك</h2>
                <div className="space-y-3">
                  {userStats.map(({ plan, count }) => (
                    <div key={plan}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">
                          {plan === 'free' ? '🌟 مجاني' : plan === 'couple' ? '💑 ثنائي' : '👨‍👩‍👧‍👦 عائلي'}
                        </span>
                        <span className="font-bold" style={{ color: 'var(--primary)' }}>{count} مستخدم</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${(count / totalUsers) * 100}%`,
                            background: 'linear-gradient(90deg, var(--primary), var(--secondary))'
                          }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Promo Tab */}
          {tab === 'promo' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-gray-800 dark:text-white">الأكواد الترويجية ({promoCodes.length})</h2>
                <button onClick={() => setPromoModal(true)} className="btn-primary flex items-center gap-2 text-sm py-2">
                  <FiPlus /> كود جديد
                </button>
              </div>

              <div className="space-y-3">
                {promoCodes.map(promo => (
                  <div key={promo.id} className="memory-card">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-lg font-mono">{promo.code}</span>
                          <span className={`badge ${promo.plan === 'couple' ? 'badge-pink' : 'badge-purple'}`}>
                            {promo.plan === 'couple' ? '💑 ثنائي' : '👨‍👩‍👧‍👦 عائلي'}
                          </span>
                          <span className={`badge ${promo.is_active ? 'badge-green' : 'bg-gray-100 text-gray-500'}`}>
                            {promo.is_active ? 'نشط' : 'معطل'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                          <span>⏱️ {promo.free_days} يوم مجاني</span>
                          <span>📊 {promo.current_uses} / {promo.max_uses || '∞'} استخدام</span>
                          {promo.expires_at && (
                            <span>📅 ينتهي: {new Date(promo.expires_at).toLocaleDateString('ar-EG')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => togglePromo(promo.id, promo.is_active)}
                          className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-400">
                          {promo.is_active ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                        </button>
                        <button onClick={() => deletePromo(promo.id)}
                          className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-400">
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {tab === 'users' && (
            <div className="glass-card rounded-2xl p-6">
              <p className="text-center text-gray-400 py-8">
                <span className="text-4xl block mb-3">👥</span>
                إجمالي المستخدمين: <strong className="gradient-text text-xl">{totalUsers}</strong>
                <br /><span className="text-sm mt-2 block">إدارة تفصيلية للمستخدمين ستتوفر قريباً</span>
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Create Promo Modal */}
      <Modal isOpen={promoModal} onClose={() => setPromoModal(false)} title="إنشاء كود ترويجي 🏷️">
        <form onSubmit={handleCreatePromo} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الكود *</label>
            <input type="text" value={promoForm.code}
              onChange={e => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
              className="input-field font-mono" placeholder="مثال: SUMMER2024" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الخطة</label>
              <select value={promoForm.plan} onChange={e => setPromoForm({ ...promoForm, plan: e.target.value })}
                className="input-field">
                <option value="couple">💑 ثنائي</option>
                <option value="family">👨‍👩‍👧‍👦 عائلي</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">أيام مجانية</label>
              <input type="number" value={promoForm.free_days} min={1}
                onChange={e => setPromoForm({ ...promoForm, free_days: Number(e.target.value) })}
                className="input-field" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">حد الاستخدام (فارغ = غير محدود)</label>
              <input type="number" value={promoForm.max_uses} min={1}
                onChange={e => setPromoForm({ ...promoForm, max_uses: e.target.value })}
                className="input-field" placeholder="∞" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الانتهاء</label>
              <input type="date" value={promoForm.expires_at}
                onChange={e => setPromoForm({ ...promoForm, expires_at: e.target.value })}
                className="input-field" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'جاري الإنشاء...' : 'إنشاء الكود'}
            </button>
            <button type="button" onClick={() => setPromoModal(false)}
              className="flex-1 py-3 rounded-xl border-2 border-gray-100 text-gray-500">إلغاء</button>
          </div>
        </form>
      </Modal>
    </AuthGuard>
  )
}
