'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import Modal from '@/components/Modal'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/contexts/AppContext'
import { FiLock, FiUnlock, FiPlus, FiTrash2, FiHeart, FiEye, FiEyeOff } from 'react-icons/fi'

interface SecretMessage {
  id: string
  user_id: string
  world_id: string | null
  title: string
  content: string
  reveal_at: string
  created_at: string
}

const emptyForm = { title: '', content: '', reveal_at: '' }

function getDaysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

export default function SecretMessagesPage() {
  const { activeWorldId } = useApp()
  const [msgs, setMsgs] = useState<SecretMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  useEffect(() => { load() }, [activeWorldId])

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    let q = supabase.from('secret_messages').select('*').order('reveal_at')
    if (activeWorldId) q = q.eq('world_id', activeWorldId)
    else q = q.eq('user_id', user.id).is('world_id', null)

    const { data } = await q
    setMsgs(data || [])
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('secret_messages').insert({
      user_id: user.id,
      world_id: activeWorldId || null,
      title: form.title,
      content: form.content,
      reveal_at: form.reveal_at,
    })
    setModalOpen(false)
    setForm(emptyForm)
    setSaving(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('حذف هذه الرسالة السرية؟')) return
    await supabase.from('secret_messages').delete().eq('id', id)
    load()
  }

  const isRevealed = (msg: SecretMessage) => getDaysUntil(msg.reveal_at) <= 0
  const isMine = (msg: SecretMessage) => msg.user_id === currentUserId

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Navbar />
        <main className="flex-1 md:mr-64 p-4 md:p-8 pt-16 md:pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
                <FiLock /> الرسائل السرية
              </h1>
              <p className="text-gray-500 text-sm mt-1">رسائل تنتظر وقتها لتُفتح 🔒</p>
            </div>
            <button onClick={() => { setForm(emptyForm); setModalOpen(true) }}
              className="btn-primary flex items-center gap-2 self-start sm:self-auto">
              <FiPlus /> رسالة سرية جديدة
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="memory-card h-24 animate-pulse bg-gray-50" />)}
            </div>
          ) : msgs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-6xl mb-4">🔒</p>
              <p className="text-xl font-semibold text-gray-700 mb-2">لا توجد رسائل سرية</p>
              <p className="text-gray-400 mb-6">اكتب رسالة تُفتح في يوم مميز</p>
              <button onClick={() => setModalOpen(true)} className="btn-primary inline-flex items-center gap-2">
                <FiHeart /> اكتب رسالة سرية
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {msgs.map(msg => {
                const unlocked = isRevealed(msg)
                const days = getDaysUntil(msg.reveal_at)
                const mine = isMine(msg)
                const showContent = unlocked || (mine && revealed[msg.id])

                return (
                  <div key={msg.id} className={`memory-card group relative overflow-hidden transition-all ${unlocked ? 'border-green-200' : 'border-pink-100'}`}>
                    {/* Color bar */}
                    <div className={`absolute top-0 right-0 w-1 h-full ${unlocked ? 'bg-gradient-to-b from-green-400 to-emerald-500' : 'bg-gradient-to-b from-pink-400 to-purple-500'}`} />

                    <div className="flex items-start gap-4 pr-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md flex-shrink-0 ${unlocked ? 'bg-gradient-to-br from-green-100 to-emerald-200' : 'bg-gradient-to-br from-pink-100 to-purple-100'}`}>
                        {unlocked ? '💌' : '🔒'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            {activeWorldId && (
                              <p className="text-xs text-gray-400 mb-0.5">{mine ? 'أنت 💙' : 'شريكك 💕'}</p>
                            )}
                            <h3 className="font-bold text-gray-800">{msg.title}</h3>

                            {showContent ? (
                              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{msg.content}</p>
                            ) : (
                              <div className={`mt-2 rounded-xl p-3 text-center ${unlocked ? 'bg-green-50' : 'bg-pink-50'}`}>
                                {unlocked ? (
                                  <p className="text-green-600 text-sm font-medium">🎉 حان وقت فتح الرسالة!</p>
                                ) : mine ? (
                                  <p className="text-pink-500 text-sm">محتوى مخفي حتى يوم الكشف 🤫</p>
                                ) : (
                                  <p className="text-purple-500 text-sm">رسالة سرية في انتظار موعدها 💕</p>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-1 flex-shrink-0">
                            {(mine || unlocked) && (
                              <button onClick={() => setRevealed(r => ({ ...r, [msg.id]: !r[msg.id] }))}
                                className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center text-purple-400 hover:bg-purple-100">
                                {revealed[msg.id] ? <FiEyeOff size={12} /> : <FiEye size={12} />}
                              </button>
                            )}
                            {mine && (
                              <button onClick={() => handleDelete(msg.id)}
                                className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <FiTrash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                          <span className="text-xs text-gray-400">
                            📅 {new Date(msg.reveal_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            unlocked ? 'bg-green-100 text-green-600' :
                            days <= 7 ? 'bg-orange-100 text-orange-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            {unlocked ? '✅ مفتوحة' : days === 1 ? 'غداً! 🎉' : `${days} يوم`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="رسالة سرية جديدة 🔒">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الرسالة *</label>
            <input type="text" placeholder="عنوان يظهر قبل الفتح..." value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">محتوى الرسالة السرية *</label>
            <textarea placeholder="اكتب رسالتك السرية..." value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              className="input-field resize-none" rows={5} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الكشف *</label>
            <input type="date" value={form.reveal_at} min={minDateStr}
              onChange={e => setForm({ ...form, reveal_at: e.target.value })}
              className="input-field" required />
            <p className="text-xs text-gray-400 mt-1">لن يُكشف المحتوى قبل هذا التاريخ</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? 'جاري الحفظ...' : <><FiLock size={14} /> إغلاق الرسالة</>}
            </button>
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 py-3 rounded-xl border-2 border-pink-100 text-gray-500 hover:bg-pink-50">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </AuthGuard>
  )
}
