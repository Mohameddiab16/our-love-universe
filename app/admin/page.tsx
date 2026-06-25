'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import Modal from '@/components/Modal'
import { supabase } from '@/lib/supabase'
import {
  FiShield, FiUsers, FiTag, FiBarChart2, FiPlus, FiTrash2,
  FiToggleLeft, FiToggleRight, FiSearch, FiEdit2, FiSlash, FiCheckCircle, FiX
} from 'react-icons/fi'

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

interface User {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  plan: string
  expires_at: string | null
  is_admin: boolean
  is_blocked: boolean
  created_at: string
}

const PLAN_LABELS: Record<string, string> = {
  free: '🌟 مجاني',
  solo: '👤 فردي',
  couple: '💑 ثنائي',
  family: '👨‍👩‍👧‍👦 عائلي',
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600',
  solo: 'bg-blue-100 text-blue-700',
  couple: 'bg-pink-100 text-pink-700',
  family: 'bg-purple-100 text-purple-700',
}

export default function AdminPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [tab, setTab] = useState<'stats' | 'users' | 'promo'>('stats')
  const [token, setToken] = useState('')

  // Stats
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalMemories, setTotalMemories] = useState(0)
  const [totalMessages, setTotalMessages] = useState(0)
  const [userStats, setUserStats] = useState<{ plan: string; count: number }[]>([])

  // Users
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [usersLoading, setUsersLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editPlanModal, setEditPlanModal] = useState(false)
  const [newPlan, setNewPlan] = useState('free')
  const [actionLoading, setActionLoading] = useState(false)

  // Promo
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [promoModal, setPromoModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [promoForm, setPromoForm] = useState({
    code: '', plan: 'couple', free_days: 30, max_uses: '', expires_at: ''
  })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return router.push('/')
      setToken(session.access_token)
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
      if (!data?.is_admin) { router.push('/'); return }
      setIsAdmin(true)
      loadStats()
      loadPromos()
    })
  }, [])

  useEffect(() => {
    const q = userSearch.toLowerCase()
    setFilteredUsers(users.filter(u =>
      u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    ))
  }, [userSearch, users])

  const loadStats = async () => {
    const [
      { count: uCount },
      { count: mCount },
      { count: msgCount },
      { data: subStats },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('memories').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('user_subscriptions').select('plan'),
    ])
    setTotalUsers(uCount || 0)
    setTotalMemories(mCount || 0)
    setTotalMessages(msgCount || 0)
    const counts: Record<string, number> = {}
    ;(subStats || []).forEach((s: any) => { counts[s.plan] = (counts[s.plan] || 0) + 1 })
    setUserStats(Object.entries(counts).map(([plan, count]) => ({ plan, count })))
  }

  const loadUsers = async () => {
    if (!token) return
    setUsersLoading(true)
    const res = await fetch('/api/admin/users', { headers: { authorization: `Bearer ${token}` } })
    const json = await res.json()
    setUsers(json.users || [])
    setFilteredUsers(json.users || [])
    setUsersLoading(false)
  }

  const loadPromos = async () => {
    const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false })
    setPromoCodes(data || [])
  }

  const handleTabChange = (t: 'stats' | 'users' | 'promo') => {
    setTab(t)
    if (t === 'users' && users.length === 0) loadUsers()
  }

  const handleSetPlan = async () => {
    if (!selectedUser) return
    setActionLoading(true)
    await fetch('/api/admin/update-user', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'set_plan', targetUserId: selectedUser.id, plan: newPlan }),
    })
    setEditPlanModal(false)
    setActionLoading(false)
    loadUsers()
  }

  const handleToggleBlock = async (user: User) => {
    const label = user.is_blocked ? 'رفع الحظر عن' : 'حظر'
    if (!confirm(`هل تريد ${label} ${user.full_name || user.email}؟`)) return
    setActionLoading(true)
    await fetch('/api/admin/update-user', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'set_blocked', targetUserId: user.id, blocked: !user.is_blocked }),
    })
    setActionLoading(false)
    loadUsers()
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
    setPromoForm({ code: '', plan: 'couple', free_days: 30, max_uses: '', expires_at: '' })
    setSaving(false)
    loadPromos()
  }

  const togglePromo = async (id: string, current: boolean) => {
    await supabase.from('promo_codes').update({ is_active: !current }).eq('id', id)
    loadPromos()
  }

  const deletePromo = async (id: string) => {
    if (!confirm('حذف هذا الكود؟')) return
    await supabase.from('promo_codes').delete().eq('id', id)
    loadPromos()
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

          <div className="mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
              <FiShield size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">لوحة تحكم الإدارة</h1>
              <p className="text-gray-400 text-xs">وصول خاص بالمالك فقط 🔒</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { id: 'stats', label: 'الإحصائيات', icon: FiBarChart2 },
              { id: 'users', label: 'المستخدمون', icon: FiUsers },
              { id: 'promo', label: 'أكواد الخصم', icon: FiTag },
            ].map(t => (
              <button key={t.id} onClick={() => handleTabChange(t.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? 'text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
                style={tab === t.id ? { background: 'linear-gradient(135deg, var(--primary), var(--secondary))' } : {}}>
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>

          {/* ===== STATS ===== */}
          {tab === 'stats' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'المستخدمون', value: totalUsers, emoji: '👥' },
                  { label: 'الذكريات', value: totalMemories, emoji: '📸' },
                  { label: 'الرسائل', value: totalMessages, emoji: '💌' },
                  { label: 'أكواد الخصم', value: promoCodes.length, emoji: '🏷️' },
                ].map(s => (
                  <div key={s.label} className="glass-card rounded-2xl p-5 text-center">
                    <p className="text-3xl mb-2">{s.emoji}</p>
                    <p className="text-2xl font-bold gradient-text">{s.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="glass-card rounded-2xl p-5">
                <h2 className="font-bold text-gray-800 dark:text-white mb-4">توزيع خطط الاشتراك</h2>
                {userStats.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">لا توجد بيانات</p>
                ) : (
                  <div className="space-y-3">
                    {userStats.map(({ plan, count }) => (
                      <div key={plan}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium">{PLAN_LABELS[plan] || plan}</span>
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
                )}
              </div>
            </div>
          )}

          {/* ===== USERS ===== */}
          {tab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="font-bold text-gray-800 dark:text-white">
                  المستخدمون ({filteredUsers.length})
                </h2>
                <button onClick={loadUsers}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 transition-colors">
                  🔄 تحديث
                </button>
              </div>

              <div className="relative">
                <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-400" />
                <input type="text" placeholder="ابحث بالاسم أو الإيميل..."
                  value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  className="input-field pr-10" />
              </div>

              {usersLoading ? (
                <div className="text-center py-16">
                  <div className="text-4xl animate-pulse mb-2">👥</div>
                  <p className="text-gray-400 text-sm">جاري تحميل المستخدمين...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-16 text-gray-400">لا يوجد مستخدمون</div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map(user => (
                    <div key={user.id}
                      className={`glass-card rounded-2xl p-4 flex items-center gap-4 ${user.is_blocked ? 'opacity-60 border-2 border-red-200' : ''}`}>
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                        {user.avatar_url
                          ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-lg">👤</span>}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">
                            {user.full_name || 'بدون اسم'}
                          </p>
                          {user.is_admin && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">👑 أدمن</span>
                          )}
                          {user.is_blocked && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">🚫 محظور</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[user.plan] || 'bg-gray-100 text-gray-600'}`}>
                            {PLAN_LABELS[user.plan] || user.plan}
                          </span>
                          {user.expires_at && (
                            <span className="text-xs text-gray-400">
                              حتى {new Date(user.expires_at).toLocaleDateString('ar-EG')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {!user.is_admin && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            title="تغيير الخطة"
                            onClick={() => { setSelectedUser(user); setNewPlan(user.plan); setEditPlanModal(true) }}
                            className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-500 transition-colors">
                            <FiEdit2 size={13} />
                          </button>
                          <button
                            title={user.is_blocked ? 'رفع الحظر' : 'حظر المستخدم'}
                            onClick={() => handleToggleBlock(user)}
                            disabled={actionLoading}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${user.is_blocked ? 'bg-green-50 hover:bg-green-100 text-green-500' : 'bg-red-50 hover:bg-red-100 text-red-500'}`}>
                            {user.is_blocked ? <FiCheckCircle size={13} /> : <FiSlash size={13} />}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== PROMO ===== */}
          {tab === 'promo' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-gray-800 dark:text-white">أكواد الخصم ({promoCodes.length})</h2>
                <button onClick={() => setPromoModal(true)} className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
                  <FiPlus /> كود جديد
                </button>
              </div>

              {promoCodes.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">🏷️</div>
                  <p className="text-gray-400">لا توجد أكواد بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {promoCodes.map(promo => (
                    <div key={promo.id} className="glass-card rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="font-bold text-base font-mono tracking-widest">{promo.code}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[promo.plan] || 'bg-gray-100 text-gray-600'}`}>
                              {PLAN_LABELS[promo.plan] || promo.plan}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${promo.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {promo.is_active ? '✅ نشط' : '⏸️ معطل'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                            <span>🎁 {promo.free_days} يوم مجاني</span>
                            <span>📊 {promo.current_uses} / {promo.max_uses ?? '∞'} استخدام</span>
                            {promo.expires_at && (
                              <span>📅 ينتهي {new Date(promo.expires_at).toLocaleDateString('ar-EG')}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => togglePromo(promo.id, promo.is_active)}
                            title={promo.is_active ? 'تعطيل' : 'تفعيل'}
                            className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-500 transition-colors">
                            {promo.is_active ? <FiToggleRight size={15} /> : <FiToggleLeft size={15} />}
                          </button>
                          <button onClick={() => deletePromo(promo.id)}
                            className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 transition-colors">
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Edit Plan Modal */}
      <Modal isOpen={editPlanModal} onClose={() => setEditPlanModal(false)} title="تغيير خطة الاشتراك 💎">
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-pink-100 flex items-center justify-center">
                {selectedUser.avatar_url
                  ? <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span>👤</span>}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{selectedUser.full_name || 'بدون اسم'}</p>
                <p className="text-xs text-gray-400">{selectedUser.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اختر الخطة الجديدة</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PLAN_LABELS).map(([id, label]) => (
                  <button key={id} type="button"
                    onClick={() => setNewPlan(id)}
                    className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${newPlan === id ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-gray-100 text-gray-500 hover:border-pink-200'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {newPlan !== 'free' && (
              <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-600 text-center">
                سيُعطى المستخدم اشتراك <strong>{PLAN_LABELS[newPlan]}</strong> مجاناً لمدة سنة كاملة
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleSetPlan} disabled={actionLoading}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {actionLoading ? '⏳ جاري...' : <><FiCheckCircle size={14} /> حفظ التغيير</>}
              </button>
              <button onClick={() => setEditPlanModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-100 text-gray-500 flex items-center justify-center gap-2">
                <FiX size={14} /> إلغاء
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Promo Modal */}
      <Modal isOpen={promoModal} onClose={() => setPromoModal(false)} title="إنشاء كود خصم جديد 🏷️">
        <form onSubmit={handleCreatePromo} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الكود *</label>
            <input type="text" value={promoForm.code}
              onChange={e => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
              className="input-field font-mono tracking-widest" placeholder="مثال: LOVE2025" required />
            <p className="text-xs text-gray-400 mt-1">سيُحوَّل لأحرف كبيرة تلقائياً</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الخطة</label>
              <select value={promoForm.plan} onChange={e => setPromoForm({ ...promoForm, plan: e.target.value })}
                className="input-field">
                <option value="solo">👤 فردي</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">حد الاستخدام</label>
              <input type="number" value={promoForm.max_uses} min={1}
                onChange={e => setPromoForm({ ...promoForm, max_uses: e.target.value })}
                className="input-field" placeholder="∞ غير محدود" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الانتهاء</label>
              <input type="date" value={promoForm.expires_at}
                onChange={e => setPromoForm({ ...promoForm, expires_at: e.target.value })}
                className="input-field" />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? '⏳ جاري الإنشاء...' : <><FiPlus size={14} /> إنشاء الكود</>}
            </button>
            <button type="button" onClick={() => setPromoModal(false)}
              className="flex-1 py-3 rounded-xl border-2 border-gray-100 text-gray-500">إلغاء</button>
          </div>
        </form>
      </Modal>
    </AuthGuard>
  )
}
