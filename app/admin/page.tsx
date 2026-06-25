'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import { supabase } from '@/lib/supabase'
import {
  FiShield, FiUsers, FiBarChart2, FiSearch,
  FiSlash, FiCheckCircle, FiEdit2, FiType, FiSave, FiX
} from 'react-icons/fi'

interface User {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  is_admin: boolean
  is_blocked: boolean
  created_at: string
}

interface SiteText {
  key: string
  label: string
  value: string
}

export default function AdminPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [tab, setTab] = useState<'stats' | 'users' | 'texts'>('stats')
  const [token, setToken] = useState('')

  // Stats
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalMemories, setTotalMemories] = useState(0)
  const [totalMessages, setTotalMessages] = useState(0)
  const [totalOccasions, setTotalOccasions] = useState(0)

  // Users
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [usersLoading, setUsersLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Site Texts
  const [texts, setTexts] = useState<SiteText[]>([])
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingText, setSavingText] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return router.push('/')
      setToken(session.access_token)
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
      if (!data?.is_admin) { router.push('/'); return }
      setIsAdmin(true)
      loadStats()
      loadTexts()
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
      { count: oCount },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('memories').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('occasions').select('*', { count: 'exact', head: true }),
    ])
    setTotalUsers(uCount || 0)
    setTotalMemories(mCount || 0)
    setTotalMessages(msgCount || 0)
    setTotalOccasions(oCount || 0)
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

  const loadTexts = async () => {
    const { data } = await supabase.from('site_texts').select('*').order('key')
    setTexts(data || [])
  }

  const handleTabChange = (t: 'stats' | 'users' | 'texts') => {
    setTab(t)
    if (t === 'users' && users.length === 0) loadUsers()
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

  const startEdit = (t: SiteText) => {
    setEditingKey(t.key)
    setEditValue(t.value)
  }

  const saveText = async (key: string) => {
    setSavingText(true)
    await supabase.from('site_texts').update({ value: editValue }).eq('key', key)
    setTexts(prev => prev.map(t => t.key === key ? { ...t, value: editValue } : t))
    setEditingKey(null)
    setSavingText(false)
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
              { id: 'texts', label: 'النصوص', icon: FiType },
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'المستخدمون', value: totalUsers, emoji: '👥' },
                { label: 'الذكريات', value: totalMemories, emoji: '📸' },
                { label: 'الرسائل', value: totalMessages, emoji: '💌' },
                { label: 'المناسبات', value: totalOccasions, emoji: '🎉' },
              ].map(s => (
                <div key={s.label} className="glass-card rounded-2xl p-5 text-center">
                  <p className="text-3xl mb-2">{s.emoji}</p>
                  <p className="text-2xl font-bold gradient-text">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                </div>
              ))}
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
                      <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                        {user.avatar_url
                          ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-lg">👤</span>}
                      </div>

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
                        <p className="text-xs text-gray-300 mt-0.5">
                          انضم {new Date(user.created_at).toLocaleDateString('ar-EG')}
                        </p>
                      </div>

                      {!user.is_admin && (
                        <button
                          title={user.is_blocked ? 'رفع الحظر' : 'حظر المستخدم'}
                          onClick={() => handleToggleBlock(user)}
                          disabled={actionLoading}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${user.is_blocked ? 'bg-green-50 hover:bg-green-100 text-green-500' : 'bg-red-50 hover:bg-red-100 text-red-500'}`}>
                          {user.is_blocked ? <FiCheckCircle size={15} /> : <FiSlash size={15} />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== TEXTS ===== */}
          {tab === 'texts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-gray-800 dark:text-white">النصوص الترحيبية</h2>
                <p className="text-xs text-gray-400">تظهر على صفحات التطبيق</p>
              </div>

              {texts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">📝</div>
                  <p className="text-gray-400 text-sm">لا توجد نصوص — شغّل الـ SQL أولاً</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {texts.map(t => (
                    <div key={t.key} className="glass-card rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-400 mb-1">{t.label}</p>
                          {editingKey === t.key ? (
                            <textarea
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="input-field resize-none w-full text-sm"
                              rows={2}
                              autoFocus
                            />
                          ) : (
                            <p className="text-gray-800 dark:text-white text-sm">{t.value}</p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {editingKey === t.key ? (
                            <>
                              <button onClick={() => saveText(t.key)} disabled={savingText}
                                className="w-8 h-8 rounded-full bg-green-50 hover:bg-green-100 flex items-center justify-center text-green-600 transition-colors">
                                <FiSave size={13} />
                              </button>
                              <button onClick={() => setEditingKey(null)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                                <FiX size={13} />
                              </button>
                            </>
                          ) : (
                            <button onClick={() => startEdit(t)}
                              className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-500 transition-colors">
                              <FiEdit2 size={13} />
                            </button>
                          )}
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
    </AuthGuard>
  )
}
