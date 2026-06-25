'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import Modal from '@/components/Modal'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/contexts/AppContext'
import { FiMessageCircle, FiPlus, FiSearch, FiTrash2, FiEdit2, FiHeart, FiSmile, FiEye } from 'react-icons/fi'

interface Message {
  id: string
  title: string
  content: string
  mood: string | null
  created_at: string
  user_id: string
  world_id: string | null
}

const moods = [
  { value: 'happy',     label: '😊 سعيد',    color: 'bg-yellow-100 text-yellow-700' },
  { value: 'love',      label: '💕 محبة',     color: 'bg-pink-100 text-pink-700' },
  { value: 'romantic',  label: '🌹 رومانسي',  color: 'bg-red-100 text-red-700' },
  { value: 'nostalgic', label: '🌙 حنين',     color: 'bg-blue-100 text-blue-700' },
  { value: 'excited',   label: '✨ متحمس',    color: 'bg-purple-100 text-purple-700' },
]

const emptyForm = { title: '', content: '', mood: 'love' }

export default function MessagesPage() {
  const { activeWorldId } = useApp()
  const [messages, setMessages] = useState<Message[]>([])
  const [filtered, setFiltered] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Message | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState('')

  useEffect(() => { loadMessages() }, [activeWorldId])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(messages.filter(m =>
      m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q)
    ))
  }, [search, messages])

  const loadMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    let query = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (activeWorldId) {
      query = query.eq('world_id', activeWorldId)
    } else {
      query = query.eq('user_id', user.id).is('world_id', null)
    }

    const { data, error } = await query
    console.log('messages data:', data, 'error:', error)
    setMessages(data || [])
    setFiltered(data || [])
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editTarget) {
      await supabase.from('messages').update({
        title: form.title, content: form.content, mood: form.mood,
      }).eq('id', editTarget.id)
    } else {
      await supabase.from('messages').insert({
        user_id: user.id,
        title: form.title,
        content: form.content,
        mood: form.mood,
        world_id: activeWorldId || null,
      })
    }

    setModalOpen(false)
    setSaving(false)
    loadMessages()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذه الرسالة؟')) return
    await supabase.from('messages').delete().eq('id', id)
    loadMessages()
  }

  const getMoodStyle = (mood: string | null) => moods.find(m => m.value === mood)?.color || 'bg-gray-100 text-gray-600'
  const getMoodLabel = (mood: string | null) => moods.find(m => m.value === mood)?.label || '💌 رسالة'

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Navbar />
        <main className="flex-1 md:mr-64 p-4 md:p-8 pt-16 md:pt-8">

          {activeWorldId && (
            <div className="mb-4 p-3 rounded-2xl flex items-center gap-2 text-sm"
              style={{ background: 'linear-gradient(135deg, var(--light), #ede9fe)' }}>
              <FiEye style={{ color: 'var(--primary)' }} size={15} />
              <span className="gradient-text font-medium">رسائل العالم المشترك — كلانا يكتب ويقرأ هنا 💕</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
                <FiMessageCircle /> رسائل الحب
              </h1>
              <p className="text-gray-500 text-sm mt-1">كلماتنا التي تملأ القلب 💌</p>
            </div>
            <button onClick={() => { setEditTarget(null); setForm(emptyForm); setModalOpen(true) }}
              className="btn-primary flex items-center gap-2 self-start sm:self-auto">
              <FiPlus /> رسالة جديدة
            </button>
          </div>

          <div className="relative mb-6">
            <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-400" />
            <input type="text" placeholder="ابحث في الرسائل..." value={search}
              onChange={e => setSearch(e.target.value)} className="input-field pr-10" />
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="memory-card h-32 bg-gray-50 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">💌</div>
              <p className="text-xl font-semibold text-gray-700 mb-2">
                {search ? 'لا توجد نتائج' : 'لا توجد رسائل بعد'}
              </p>
              <p className="text-gray-400 mb-6">اكتب أول رسالة حب</p>
              {!search && (
                <button onClick={() => { setEditTarget(null); setForm(emptyForm); setModalOpen(true) }}
                  className="btn-primary inline-flex items-center gap-2">
                  <FiHeart /> اكتب رسالة
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(msg => (
                <div key={msg.id} className="memory-card group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mt-0.5 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                        <FiHeart className="text-pink-400" size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {activeWorldId && (
                          <p className="text-xs text-gray-400 mb-0.5">
                            {msg.user_id === currentUserId ? 'أنت 💙' : 'شريكك 💕'}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-gray-800">{msg.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getMoodStyle(msg.mood)}`}>
                            {getMoodLabel(msg.mood)}
                          </span>
                        </div>
                        <p className={`text-gray-600 text-sm leading-relaxed ${expanded === msg.id ? '' : 'line-clamp-2'}`}>
                          {msg.content}
                        </p>
                        {msg.content.length > 120 && (
                          <button onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
                            className="text-pink-500 text-xs mt-1 hover:underline">
                            {expanded === msg.id ? 'إخفاء' : 'قراءة المزيد'}
                          </button>
                        )}
                        <p className="text-gray-400 text-xs mt-2">
                          {new Date(msg.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {msg.user_id === currentUserId && (
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => { setEditTarget(msg); setForm({ title: msg.title, content: msg.content, mood: msg.mood || 'love' }); setModalOpen(true) }}
                          className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-400 hover:text-blue-600">
                          <FiEdit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(msg.id)}
                          className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'تعديل الرسالة' : 'رسالة حب جديدة 💌'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الرسالة *</label>
            <input type="text" placeholder="ما موضوع هذه الرسالة؟" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الرسالة *</label>
            <textarea placeholder="اكتب كلماتك من القلب..." value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              className="input-field resize-none" rows={6} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiSmile className="inline ml-1" /> المزاج
            </label>
            <div className="flex flex-wrap gap-2">
              {moods.map(mood => (
                <button key={mood.value} type="button" onClick={() => setForm({ ...form, mood: mood.value })}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all border-2 ${
                    form.mood === mood.value ? 'border-pink-400 ' + mood.color : 'border-transparent bg-gray-100 text-gray-600 hover:border-pink-200'
                  }`}>
                  {mood.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? 'جاري الحفظ...' : <><FiHeart /> {editTarget ? 'حفظ التعديلات' : 'إرسال الرسالة'}</>}
            </button>
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 py-3 rounded-xl border-2 border-pink-100 text-gray-500 hover:bg-pink-50 transition-colors">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </AuthGuard>
  )
}
