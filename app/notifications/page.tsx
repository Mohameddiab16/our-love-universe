'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import { supabase } from '@/lib/supabase'
import { FiBell, FiCheck, FiTrash2 } from 'react-icons/fi'

interface Notification {
  id: string
  title: string
  body: string | null
  type: string
  is_read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadNotifs() }, [])

  const loadNotifs = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('notifications').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false })
    setNotifs(data || [])
    setLoading(false)
    // Mark all as read
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
  }

  const deleteNotif = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  const deleteAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').delete().eq('user_id', user.id)
    setNotifs([])
  }

  const typeEmoji: Record<string, string> = {
    info: 'ℹ️', success: '✅', warning: '⚠️', occasion: '🎉', message: '💌', challenge: '⚡'
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Navbar />
        <main className="flex-1 md:mr-64 p-4 md:p-8 pt-16 md:pt-8 animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold gradient-text flex items-center gap-2 mb-1">
                <FiBell /> الإشعارات
              </h1>
              <p className="text-gray-400 text-sm">كل التحديثات والتنبيهات 🔔</p>
            </div>
            {notifs.length > 0 && (
              <button onClick={deleteAll}
                className="text-sm text-red-400 hover:text-red-600 underline">
                حذف الكل
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="memory-card h-16 animate-pulse bg-gray-50" />)}
            </div>
          ) : notifs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-6xl mb-4">🔔</p>
              <p className="text-xl font-semibold text-gray-700">لا توجد إشعارات</p>
              <p className="text-gray-400 mt-2 text-sm">ستظهر هنا التنبيهات والمناسبات القادمة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifs.map(n => (
                <div key={n.id} className={`memory-card flex items-start gap-4 ${!n.is_read ? 'border-l-4' : ''}`}
                  style={!n.is_read ? { borderLeftColor: 'var(--primary)' } : {}}>
                  <span className="text-2xl flex-shrink-0">{typeEmoji[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-white">{n.title}</p>
                    {n.body && <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleDateString('ar-EG', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button onClick={() => deleteNotif(n.id)}
                    className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 flex-shrink-0">
                    <FiTrash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
